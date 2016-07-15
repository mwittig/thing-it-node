module.exports = {
    create: function () {
        return new Device();
    },
    bind: function (node, device) {
        utils.inheritMethods(device, new Device());

        if (!node.plugins[device.plugin]) {
            throw "No Device Plugin loaded for Plugin Path " + device.plugin;
            //device.logDebug("No Device Plugin loaded for Plugin Path " + device.plugin);
            // node.loadDevicePluginModule(device.plugin); TODO To be added
        } else {
            utils.inheritMethods(device, require(
                node.plugins[device.plugin].modulePath).create());

            // TODO Move to bind() method

            device.node = node;
            device.type = node.plugins[device.plugin];
            node[device.id] = device;

            if (!device.configuration) {
                device.configuration = {};
            }

            if (!device.actors) {
                device.actors = [];
            }

            if (!device.sensors) {
                device.sensors = [];
            }

            device.logDebug("Binding actors for device.");

            for (var n = 0; n < device.actors.length; ++n) {
                try {
                    actor.bind(device, device.actors[n]);
                } catch (error) {
                    device.logError("Failed to bind Actor [" + device.actors[n].id
                        + "]: " + error);
                }
            }

            device.logDebug("Binding sensors for device.");

            for (var n = 0; n < device.sensors.length; ++n) {
                try {
                    sensor.bind(device, device.sensors[n]);
                } catch (error) {
                    device.logError("Failed to bind Sensor [" + device.sensors[n].id
                        + "]: " + error);
                }
            }

            device.eventProcessors = [];

            return device;
        }
    }
};

var q = require('q');
var fs = require('fs');
var utils = require("./utils");
var logger = require("./logger");
var sensor = require("./sensor");
var actor = require("./actor");

function Device() {
    this.class = "Device";

    utils.inheritMethods(this, logger.create());

    /**
     * Required for logging.
     */
    Device.prototype.publishMessage = function (content) {
        this.node.publishMessage(content);
    };

    Device.prototype.clientCopy = function () {
        var copy = {
            id: this.id,
            label: this.label,
            plugin: this.plugin,
            configuration: this.configuration, // TODO Full copy?
            actors: [],
            sensors: []
        };

        if (this.uuid) {
            copy.uuid = this.uuid;
        }

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

        // For logging

        this.class = "Device";
        this.operationalState = {state: 'normal'};
        this.state = {};

        this.logInfo("Starting Device [" + this.label + "]");

        this.start().then(function () {
            this.publishOperationalStateChange();
            this.publishStateChange();

            this.completeStart().then(function () {
                deferred.resolve();
            }.bind(this)).fail(function (error) {
                this.logError(error);

                deferred.reject("Failed to start Device [" + this.label
                    + "] started: " + error);
            }.bind(this));
        }.bind(this)).fail(function (error) {
            this.logError(error);

            deferred.reject("Failed to start Device [" + this.label
                + "] started: " + error);
        }.bind(this));

        return deferred.promise;
    };

    /**
     *
     */
    Device.prototype.stopDevice = function () {
        var deferred = q.defer();

        this.logInfo("Stopping Device [" + this.label + "]");

        for (var n in this.actors) {
            this.actors[n].stopActor();
        }

        this.logDebug("Stopped Actors.");

        for (var n in this.sensors) {
            this.sensors[n].stopSensor();
        }

        this.logDebug("Stopped Sensors.");

        if (this.stop) {
            try {
                this.stop();
            } catch (error) {
                this.logError(error);
            }
        }

        this.logInfo("Device [" + this.label + "] stopped.");

        deferred.resolve();

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

                this.logInfo("Device [" + this.label + "] started.");

                deferred.resolve();
            }.bind(this)).fail(function (error) {
                this.logError(error);

                deferred.reject(error);
            });
        }
        catch (error) {
            this.logError(error);

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
    Device.prototype.isSimulated = function () {
        return (this.configuration && this.configuration.simulated) || this.node.isSimulated();
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
    Device.prototype.publishOperationalStateChange = function () {
        for (var n = 0; n < this.eventProcessors.length; ++n) {
            this.eventProcessors[n].pushDeviceOperationalState(this, this.operationalState);
        }

        this.node.publishDeviceOperationalStateChange(this, this
            .operationalState);
    };

    /**
     *
     */
    Device.prototype.publishStateChange = function () {
        for (var n = 0; n < this.eventProcessors.length; ++n) {
            this.eventProcessors[n].pushDeviceState(this, this.getState());
        }

        this.node.publishDeviceStateChange(this, this
            .getState());
    };

    /**
     *
     */
    Device.prototype.pipeFile = function (req, res, file, type) {
        this.logDebug("Start piping");

        var range = req.headers.range;

        if (!req.headers.range) {
            this.logDebug("No range requested");

            res.end();
        }
        else {
            this.logDebug("Range ", range);

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

                    this.logDebug("Wrote header");

                    var stream = fs.createReadStream(file, {start: start, end: end})
                        .on("open", function () {
                            stream.pipe(res);
                        }).on("error", function (error) {
                            res.end(error);
                        });
                }
                catch (error) {
                    this.logError(error);

                    res.end("Cannot read buffer.");
                }
            }.bind(this));
        }
    };
}