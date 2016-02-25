module.exports = {
    metadata: {
        plugin: "routingBinarySensor",
        label: "Routing Binary Sensor",
        role: "actor",
        family: "routingBinarySensor",
        deviceTypes: ["z-wave/zWaveNetwork"],
        services: [],
        state: [
            {
                id: "value", label: "Value",
                type: {
                    id: "integer"
                }
            }],
        configuration: [{
            label: "Node ID",
            id: "nodeId",
            type: {
                id: "integer"
            },
            defaultValue: "1"
        }]
    },
    create: function () {
        return new RoutingBinarySensor();
    }
};

var q = require('q');

/**
 *
 */
function RoutingBinarySensor() {
    /**
     *
     */
    RoutingBinarySensor.prototype.start = function () {
        var deferred = q.defer();

        this.state = {
            temperature: 0
        };

        if (this.isSimulated()) {
        } else {
            this.device.nodes[this.configuration.nodeId] = {unit: this};
        }

        deferred.resolve();

        return deferred.promise;
    };

    /**
     *
     */
    RoutingBinarySensor.prototype.setStateFromZWave = function (comClass, command) {
        if (comClass == 32) { // Basic
            this.publishStateChange();
        }
        else if (comClass == 48) { // SensorBinary
            this.logDebug("Level of Binary Sensor", command);

            this.state.value = command.value ? 100 : 0;
            this.publishStateChange();
        }
        else if (comClass == 132) { // Wakeup
            this.logDebug("Wakeup", command.value);

//        default: default wakeup interval (constant), only filled if device support Wakeup Command
//            Class Version 2
//• interval: wakeup interval in seconds
//• lastSleep: UNIX time stamp of last sleep() command sent
//• lastWakeup: UNIX time stamp of last wakeup notification() received
//• max: maximum accepted wakeup interval (constant), only filled if device support Wakeup
//            Command Class Version 2
//• min: min. allowed wakeup interval (constant), only filled if device support Wakeup Command
//            Class Version 2
//• nodeId: Node ID of the device that will receive the wakeup notification of this device
//• step: step size of wakeup interval setting allows (constant), only filled if device support
//            Wakeup Command Class Version 2

            this.publishStateChange();
        }
        else {
            this.logDebug("Other State Change", comClass, value);
        }
    };

    /**
     *
     */
    RoutingBinarySensor.prototype.handleEventFromZWave = function(event, valueid) {
        this.logDebug("Event: " + event + " on Value ID " + valueid);
    }

    /**
     *
     */
    RoutingBinarySensor.prototype.handleNotificationFromZWave = function(notif, help) {
        this.logDebug(help + " (" + notif + ")");
    }

    /**
     *
     */
    RoutingBinarySensor.prototype.stop = function () {
        var deferred = q.defer();

        deferred.resolve();

        return deferred.promise;
    };

    /**
     *
     */
    RoutingBinarySensor.prototype.getState = function () {
        return this.state;
    };

    /**
     *
     */
    RoutingBinarySensor.prototype.setState = function (state) {
    };
};
