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

            utils.promiseSequence(this.actors, 0, "start").then(function () {
                for (var n = 0; n < self.sensors.length; ++n) {
                    self.sensors[n].start();
                }

                console.log("\tDevice [" + self.label + "] started.");

                deferred.resolve();
            }).fail(function (error) {
                console.error(error);

                deferred.reject(error);
            });
        } catch (error) {
            console.error(error);

            deferred.reject("Failed to start Actor [" + self.label
            + "] started: " + error);
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
        return this.node.isSimulated();
    };

    /**
     *
     */
    Device.prototype.publishStateChange = function () {
        this.node.publishDeviceStateChange(this, this
            .getState());
    }
}