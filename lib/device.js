module.exports = {
    bind: function (node, device) {
        utils.inheritMethods(device, new Device());
        utils.inheritMethods(device, require(
            node.plugins[device.plugin].modulePath).create());

        device.node = node;
        device.type = node.plugins[device.plugin];
        node[device.id] = device;

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
    /**
     *
     */
    Device.prototype.startDevice = function (app, io) {
        var deferred = q.defer();

        this.state = {};

        console.log("\tStarting Device [" + this.label + "]");

        var self = this;

        this.start().then(function () {
            try {
                // Bind Services

                this.node.app.post("/devices/" + self.id
                + "/services/:service", function (req, res) {
                    self.node.verifyCallSignature(req, res, function () {
                        try {
                            self[req.params.service](req.body);

                            res.send(self.getState());
                        } catch (x) {
                            console.error(x);
                            res.status(500).send(
                                "Failed to invoke service ["
                                + req.params.service + "]: " + x);
                        }
                    });
                });

                if (!this.actors) {
                    this.actors = [];
                }

                if (!this.sensors) {
                    this.sensors = [];
                }

                for (var n = 0; n < this.actors.length; ++n) {
                    try {
                        actor.bind(this, this.actors[n]);
                    } catch (error) {
                        console.error("Failed to bind Actor [" + this.actors[n].id
                        + "]: " + error);
                    }
                }

                for (var n = 0; n < this.sensors.length; ++n) {
                    try {
                        sensor.bind(this, this.sensors[n]);
                    } catch (error) {
                        console.error("Failed to bind Sensor [" + this.actors[n].id
                        + "]: " + error);
                    }
                }

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
            } catch (error) {
                console.error(error);

                deferred.reject("Failed to start Actor [" + this.label
                + "] started: " + error);
            }
        }.bind(this)).fail(function (error) {
            console.error(error);

            deferred.reject("Failed to start Actor [" + this.label
            + "] started: " + error);
        }.bind(this));

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
        return this.node.isSimulated();
    };

    /**
     *
     */
    Device.prototype.publishStateChange = function () {
        this.node.publishDeviceStateChange(this, this
            .getState());
    };

    /**
     *
     */
    Device.prototype.pipeFile = function (req, res, file, type) {
        var range = req.headers.range;
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
    };
}