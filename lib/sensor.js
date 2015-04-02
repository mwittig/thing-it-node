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

var utils = require("./utils");

/**
 *
 */
function Sensor() {
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
        if (this.isSimulated()) {
            this.initializeSimulation();
        }

        this.start();

        console.log("\t\tSensor [" + this.label + "] started.");
    };

    /**
     *
     */
    Sensor.prototype.stopSensor = function () {
        console.log("\t\tSensor [" + this.name + "] stopped.");
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
        return this.device.isSimulated();
    };

    /**
     *
     */
    Sensor.prototype.initializeSimulation = function () {
        var self = this;

        this.device.node.app.post("/devices/" + this.device.id + "/sensors/"
        + this.id + "/data", function (req, res) {
            res.send("");

            self.value = req.body.data;

            self.data(req.body.data);
        });
        this.device.node.app.post("/devices/" + this.device.id + "/sensors/"
        + this.id + "/event", function (req, res) {
            res.send("");

            self.change(req.body.type);
        });
    };
}