module.exports = {
    metadata: {
        plugin: "thermostatGeneric",
        label: "Thermostat Generic",
        role: "actor",
        family: "thermostatGeneric",
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
        return new ThermostatGeneric();
    }
};

var q = require('q');

/**
 *
 */
function ThermostatGeneric() {
    /**
     *
     */
    ThermostatGeneric.prototype.start = function () {
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
    ThermostatGeneric.prototype.setStateFromZWave = function (comClass, command) {
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

            this.publishStateChange();
        }
        else {
            this.logDebug("Other State Change", comClass, command.value);
        }
    };

    /**
     *
     */
    ThermostatGeneric.prototype.handleEventFromZWave = function(event, valueid) {
        this.logDebug("Event: " + event + " on Value ID " + valueid);
    }

    /**
     *
     */
    ThermostatGeneric.prototype.handleNotificationFromZWave = function(notif, help) {
        this.logDebug(help + " (" + notif + ")");
    }

    /**
     *
     */
    ThermostatGeneric.prototype.stop = function () {
        var deferred = q.defer();

        deferred.resolve();

        return deferred.promise;
    };

    /**
     *
     */
    ThermostatGeneric.prototype.getState = function () {
        return this.state;
    };

    /**
     *
     */
    ThermostatGeneric.prototype.setState = function (state) {
    };
};
