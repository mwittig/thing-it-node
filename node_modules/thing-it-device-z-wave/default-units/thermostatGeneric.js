module.exports = {
    metadata: {
        plugin: "thermostatGeneric",
        label: "Thermostat Generic",
        role: "actor",
        family: "thermostatGeneric",
        deviceTypes: ["z-wave/zWaveNetwork"],
        services: [],
        state: [{
            id: "mode", label: "Mode",
            type: {
                id: "string"
            }
        }, {
            id: "operatingState", label: "Operating State",
            type: {
                id: "string"
            }
        }, {
            id: "setpoint", label: "Setpoint",
            type: {
                id: "decimal"
            }
        }, {
            id: "temperature", label: "Temperature",
            type: {
                id: "decimal"
            }
        }, {
            id: "fanMode", label: "Fan Mode",
            type: {
                id: "string"
            }
        }, {
            id: "fanState", label: "Fan State",
            type: {
                id: "string"
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
        else if (comClass == 49) { // Multi Sensor
            this.logDebug("Sensor Value", command);
            this.state.temperature = command.value;

            this.publishStateChange();
        }
        else if (comClass == 64) { // Thermostat Mode
            this.logDebug("Thermostat Mode", command);
            this.state.mode = command.value;

            this.publishStateChange();
        }
        else if (comClass == 66) { // Thermostat Operating State
            this.logDebug("Thermostat Operating State", command);
            this.state.operatingState = command.value;

            this.publishStateChange();
        }

        else if (comClass == 67) { // Thermostat Setpoint
            this.logDebug("Thermostat Setpoint", command);
            this.state.setpoint = command.value;

            this.publishStateChange();
        }
        else if (comClass == 68) { // Thermostat Fan Mode
            this.logDebug("Thermostat Fan Mode", command);
            this.state.fanMode = command.value;

            this.publishStateChange();
        }
        else if (comClass == 69) { // Thermostat Fan State
            this.logDebug("Thermostat Fan State", command);

            this.state.fanState = command.value;
            this.publishStateChange();
        }
        else if (comClass == 129) { // Clock
            this.logDebug("Clock", command.value);
        }
        else if (comClass == 132) { // Wakeup
            this.logDebug("Wakeup", command.value);
        }
        else if (comClass == 134) { // Version
            this.logDebug("Version", command.value);
        }
        else if (comClass == 135) { // Indicator
            this.logDebug("Indicator", command.value);
        }
        else {
            this.logDebug("Other State Change", comClass, command.value);
        }
    };

    /**
     *
     */
    ThermostatGeneric.prototype.handleEventFromZWave = function (event, valueid) {
        this.logDebug("Event: " + event + " on Value ID " + valueid);
    }

    /**
     *
     */
    ThermostatGeneric.prototype.handleNotificationFromZWave = function (notif, help) {
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

    /**
     *
     */
    ThermostatGeneric.prototype.incrementSetpoint = function () {
        this.logDebug("Called incrementSetpoint()");

        if (this.isSimulated()) {
            this.state.setpoint + 0.5;

            this.publishStateChange();
        } else {
            if (this.device.nodes[this.configuration.nodeId]) {
                this.device.zWave.setValue(this.configuration.nodeId, 67, 1, 0, this.state.setpoint + 0.5);
                this.publishStateChange();
            }
            else {
                this.logError("Z-Wave Node is not ready.");
            }
        }
    };

    /**
     *
     */
    ThermostatGeneric.prototype.decrementSetpoint = function () {
        this.logDebug("Called decrementSetpoint()");

        if (this.isSimulated()) {
            this.state.setpoint + 0.5;

            this.publishStateChange();
        } else {
            if (this.device.nodes[this.configuration.nodeId]) {
                this.device.zWave.setValue(this.configuration.nodeId, 67, 1, 0, this.state.setpoint - 0.5);
                this.publishStateChange();
            }
            else {
                this.logError("Z-Wave Node is not ready.");
            }
        }
    };
};
