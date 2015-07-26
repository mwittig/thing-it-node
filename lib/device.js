module.exports = {
    create: function () {
        return new Device();
    },
    bind: function (node, device) {
        utils.inheritMethods(device, new Device());
        utils.inheritMethods(device, require(
            node.plugins[device.plugin].modulePath).create());

        // TODO Move to bind() method

        device.node = node;
        device.type = node.plugins[device.plugin];
        node[device.id] = device;

        if (!device.actors) {
            device.actors = [];
        }

        if (!device.sensors) {
            device.sensors = [];
        }

        for (var n = 0; n < device.actors.length; ++n) {
            try {
                actor.bind(device, device.actors[n]);
            } catch (error) {
                console.error("Failed to bind Actor [" + device.actors[n].id
                + "]: " + error);
            }
        }

        for (var n = 0; n < device.sensors.length; ++n) {
            try {
                sensor.bind(device, device.sensors[n]);
            } catch (error) {
                console.error("Failed to bind Sensor [" + device.actors[n].id
                + "]: " + error);
            }
        }

        device.eventProcessors = [];

        return device;
    }
};

var q = require('q');
var fs = require('fs');
var lodash = require('lodash');
var utils = require("./utils");
var sensor = require("./sensor");
var actor = require("./actor");

function Device() {
    Device.prototype.clientCopy = function () {
        var copy = {
            id: this.id,
            label: this.label,
            plugin: this.plugin,
            configuration: this.configuration, // TODO Full copy?
            actors: [],
            sensors: []
        };

        for (var n in this.actors) {
            copy.actors.push(
                this.actors[n].clientCopy());
        }

        for (var n in this.sensors) {
            copy.sensors.push(this.sensors[n].clientCopy());
        }

        return copy;
    };

    /**
     *
     */
    Device.prototype.startDevice = function () {
        var deferred = q.defer();

        this.state = {};

        console.log("\tStarting Device [" + this.label + "]");

        this.start().then(function () {
            this.completeStart().then(function () {
                deferred.resolve();
            }.bind(this)).fail(function (error) {
                console.error(error);

                deferred.reject("Failed to start Device [" + this.label
                + "] started: " + error);
            }.bind(this));
        }.bind(this)).fail(function (error) {
            console.error(error);

            deferred.reject("Failed to start Device [" + this.label
            + "] started: " + error);
        }.bind(this));

        return deferred.promise;
    };

    /**
     *
     */
    Device.prototype.completeStart = function () {
        var deferred = q.defer();

        try {
            utils.promiseSequence(this.actors, 0, "startActor").then(function () {
                for (var n = 0; n < this.sensors.length; ++n) {
                    this.sensors[n].startSensor();
                }

                this.publishStateChange();

                console.log("\tDevice [" + this.label + "] started.");

                deferred.resolve();
            }.bind(this)).fail(function (error) {
                console.error(error);

                deferred.reject(error);
            });
        }
        catch (error) {
            console.error(error);

            deferred.reject(error);
        }


        return deferred.promise;
    };

    /**
     *
     */
    Device.prototype.findActorType = function (plugin) {
        for (var n = 0; n < this.type.actorTypes.length; ++n) {
            if (this.type.actorTypes[n].plugin === plugin) {
                return this.type.actorTypes[n];
            }
        }

        throw "Cannot find Actor Type <" + plugin + ">.";
    };

    /**
     *
     */
    Device.prototype.startSensors = function () {
    };

    /**
     *
     */
    Device.prototype.findSensorType = function (plugin) {
        for (var n = 0; n < this.type.sensorTypes.length; ++n) {
            if (this.type.sensorTypes[n].plugin === plugin) {
                return this.type.sensorTypes[n];
            }
        }

        throw "Cannot find Sensor Type [" + plugin + "].";
    };

    /**
     *
     */
    Device.prototype.findActor = function (id) {
        for (var n = 0; n < this.actors.length; ++n) {
            if (this.actors[n].id == id) {
                return this.actors[n];
            }
        }

        throw "No actor exists with ID " + id + ".";
    };

    /**
     *
     */
    Device.prototype.stop = function () {
        console.log("\tStopping Device [" + this.label + "].");

        for (var n = 0; n < this.actors.length; ++n) {
            this.actors[n].stop();
        }

        for (var n = 0; n < this.sensors.length; ++n) {
            this.sensors[n].stop();
        }

        for (var n = 0; n < this.services.length; ++n) {
            // this.services[n];
        }

        console.log("\tDevice [" + this.label + "] stopped.");
    };

    /**
     *
     */
    Device.prototype.isSimulated = function () {
        return this.configuration.simulated || this.node.isSimulated();
    };

    /**
     *
     */
    Device.prototype.publishEvent = function (event, data) {
        for (var n = 0; n < this.eventProcessors.length; ++n) {
            this.eventProcessors[n].notifyOnDeviceEvent(this, {
                type: event,
                data: data
            });
        }

        this.node.publishEvent({
            node: this.node.id,
            device: this.id,
            type: event,
            data: data
        });
    };

    /**
     *
     */
    Device.prototype.publishStateChange = function () {
        /*for (var n = 0; n < this.eventProcessors.length; ++n) {
            this.eventProcessors[n].push(this, data);
            this.eventProcessors[n].notify(this, {
                type: "valueChange",
                data: data
            });
        }*/

        this.node.publishDeviceStateChange(this, this
            .getState());
    };

    /**
     *
     */
    Device.prototype.pipeFile = function (req, res, file, type) {
        var range = req.headers.range;

        if (!req.headers.range) {
            res.end();
        }
        else {
            var positions = range.replace(/bytes=/, "").split("-");
            var start = parseInt(positions[0], 10);

            fs.stat(file, function (err, stats) {
                try {
                    var total = stats.size;
                    var end = positions[1] ? parseInt(positions[1], 10) : total - 1;
                    var chunksize = (end - start) + 1;

                    res.writeHead(206, {
                        "Content-Range": "bytes " + start + "-" + end + "/" + total,
                        "Accept-Ranges": "bytes",
                        "Content-Length": chunksize,
                        "Content-Type": type
                    });

                    var stream = fs.createReadStream(file, {start: start, end: end})
                        .on("open", function () {
                            stream.pipe(res);
                        }).on("error", function (error) {
                            res.end(error);
                        });
                }
                catch (error) {
                    res.end("Cannot read buffer.");
                }
            });
        }
    };
}