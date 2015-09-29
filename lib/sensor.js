module.exports = {
    bind: function (device, sensor) {
        utils.inheritMethods(sensor, new Sensor());
        utils.inheritMethods(sensor, require(
            device.findSensorType(sensor.type).modulePath).create());

        sensor.device = device;
        sensor.eventProcessors = [];
        device[sensor.id] = sensor;

        return sensor;
    }
};

var q = require('q');
var utils = require("./utils");
var logger = require("./logger");

/**
 *
 */
function Sensor() {
    this.class = "Sensor";

    utils.inheritMethods(this, logger.create());

    /**
     * Required for logging.
     */
    Sensor.prototype.publishMessage = function (content) {
        this.device.node.publishMessage(content);
    };

    Sensor.prototype.clientCopy = function () {
        return {
            id: this.id, label: this.label, type: this.type,
            configuration: this.configuration // TODO Full copy?
        };
    };

    /**
     *
     */
    Sensor.prototype.startSensor = function () {
        var deferred = q.defer();

        // For logging

        this.class = "Sensor";

        if (this.isSimulated()) {
            this.initializeSimulation();
        }

        this.logInfo("Starting Sensor [" + this.label + "]");

        this.start();
        deferred.resolve();

        this.logInfo("Sensor [" + this.label + "] started.");

        return deferred.promise;
    };

    /**
     *
     */
    Sensor.prototype.stopSensor = function () {
        var deferred = q.defer();

        this.stop();
        this.logInfo("Sensor [" + this.name + "] stopped.");
        deferred.resolve();

        return deferred.promise;
    };

    /**
     * TODO Move into Sensor Protocol
     */
    Sensor.prototype.stop = function () {
    };

    /**
     *
     */
    Sensor.prototype.change = function (event, data) {
        // TODO Publish change only if specified so

        if (true) {
            this.publishEvent(event, data);
        }

        for (var n = 0; n < this.eventProcessors.length; ++n) {
            this.eventProcessors[n].notify(this, {
                type: event,
                data: data
            });
        }
    };

    /**
     *
     */
    Sensor.prototype.data = function (data) {
        // Publish data only if specified so

        if (true) {
            this.publishValueChangeEvent(data);
        }

        for (var n = 0; n < this.eventProcessors.length; ++n) {
            this.eventProcessors[n].push(this, data);
            this.eventProcessors[n].notify(this, {
                type: "valueChange",
                data: data
            });
        }
    };

    /**
     *
     */
    Sensor.prototype.stop = function () {
    };

    /**
     *
     */
    Sensor.prototype.publishEvent = function (event, data) {
        for (var n = 0; n < this.eventProcessors.length; ++n) {
            this.eventProcessors[n].notify(this, {
                type: event,
                data: data
            });
        }

        this.device.node.publishEvent({
            node: this.device.node.id,
            device: this.device.id,
            sensor: this.id,
            type: event,
            data: data
        });
    };

    /**
     *
     */
    Sensor.prototype.publishValueChangeEvent = function (data) {
        for (var n = 0; n < this.eventProcessors.length; ++n) {
            this.eventProcessors[n].push(this, data);
        }

        this.device.node.publishEvent({
            node: this.device.node.id,
            device: this.device.id,
            sensor: this.id,
            type: "valueChange",
            value: data
        });
    };

    /**
     *
     */
    Sensor.prototype.publishMessage = function (message) {
        this.device.node.publishMessage(message);
    };

    /**
     *
     */
    Sensor.prototype.isSimulated = function () {
        return this.configuration.simulated || this.device.isSimulated();
    };

    /**
     *
     */
    Sensor.prototype.initializeSimulation = function () {
        //var self = this;
        //
        //this.device.node.app.post("/devices/" + this.device.id + "/sensors/"
        //+ this.id + "/data", function (req, res) {
        //    res.send("");
        //
        //    self.value = req.body.data;
        //
        //    self.data(req.body.data);
        //});
        //this.device.node.app.post("/devices/" + this.device.id + "/sensors/"
        //+ this.id + "/event", function (req, res) {
        //    res.send("");
        //
        //    self.change(req.body.type);
        //});
    };
}