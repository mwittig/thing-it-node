module.exports = {
    metadata: {
        plugin: "binaryPowerSwitch",
        label: "Z-Wave Binary Power Switch",
        role: "actor",
        family: "binaryPowerSwitch",
        deviceTypes: ["z-wave/zWaveNetwork"],
        services: [{
            id: "on",
            label: "On"
        }, {
            id: "off",
            label: "Off"
        }, {
            id: "toggle",
            label: "Toggle"
        }],
        state: [
            {
                id: "switch", label: "Switch",
                type: {
                    id: "boolean"
                }
            }, {
                id: "power", label: "Power",
                type: {
                    id: "decimal"
                }
            }, {
                id: "energy", label: "Energy",
                type: {
                    id: "decimal"
                }
            }, {
                id: "voltage", label: "Voltage",
                type: {
                    id: "decimal"
                }
            }, {
                id: "current", label: "Current",
                type: {
                    id: "decimal"
                }
            }],
        configuration: [
            {
                label: "Node ID",
                id: "nodeId",
                type: {
                    id: "integer"
                },
                defaultValue: "1"
            },
            {
                label: "Device Type",
                id: "deviceType",
                type: {
                    id: "string"
                },
                defaultValue: ""
            },
            {
                label: "Manufacturer",
                id: "manufacturer",
                type: {
                    id: "string"
                },
                defaultValue: ""
            },
            {
                label: "Product",
                id: "product",
                type: {
                    id: "string"
                },
                defaultValue: ""
            }]
    },
    create: function () {
        return new BinaryPowerSwitch();
    }
};

var q = require('q');

/**
 *
 */
function BinaryPowerSwitch() {
    /**
     *
     */
    BinaryPowerSwitch.prototype.start = function () {
        var deferred = q.defer();

        this.state = {
            switch: false,
            power: 0
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
    BinaryPowerSwitch.prototype.setStateFromZWave = function (comClass, value) {
        if (comClass == 37) {
            this.state.switch = value.value;
            this.logDebug("State", this.state);
            this.publishStateChange();
        } else if (comClass == 50) {
            if (value.label == "Power") {
                this.state.power = parseFloat(value.value);
                this.logDebug("State", this.state);
                this.publishStateChange();
            } else if (value.label == "Energy") {
                this.state.energy = parseFloat(value.value);
                this.logDebug("State", this.state);
                this.publishStateChange();
            } else if (value.label == "Voltage") {
                this.state.voltage = parseFloat(value.value);
                this.logDebug("State", this.state);
                this.publishStateChange();
            } else if (value.label == "Current") {
                this.state.current = parseFloat(value.value);
                this.logDebug("State", this.state);
                this.publishStateChange();
            }
            else {
                this.logDebug("Ignoring state update.", value.label, value.value);
            }
        }
    };

    /**
     *
     */
    BinaryPowerSwitch.prototype.handleEventFromZWave = function (event, valueid) {
        this.logDebug("Event: " + event + " on Value ID " + valueid);
    }

    /**
     *
     */
    BinaryPowerSwitch.prototype.handleNotificationFromZWave = function (notif, help) {
        this.logDebug(help + " (" + notif + ")");
    }

    /**
     *
     */
    BinaryPowerSwitch.prototype.scanComplete = function () {
        this.logDebug("Received scan complete on node id " + this.configuration.nodeId + " with device type "
            + this.configuration.deviceType + ".");

        if (!this.isSimulated() &&
            ("Smart Energy Switch" == this.configuration.product) &&
            ("Aeotec" == this.configuration.manufacturer)) {
            this.logDebug("1st generation Aeotec power switch - enabling polling.");
/*
            this.device.zWave.setValue(this.configuration.nodeId, 112, 1, 80, 1);
            this.device.zWave.setValue(this.configuration.nodeId, 112, 1, 90, true);
            this.device.zWave.setValue(this.configuration.nodeId, 112, 1, 100, 0);
            this.device.zWave.setValue(this.configuration.nodeId, 50, 1, 32, true);
*/
            this.device.zWave.enablePoll(this.configuration.nodeId, 50);
        }
    };

    /**
     *
     */
    BinaryPowerSwitch.prototype.stop = function () {
        var deferred = q.defer();

        deferred.resolve();

        return deferred.promise;
    };

    /**
     *
     */
    BinaryPowerSwitch.prototype.getState = function () {
        return this.state;
    };

    /**
     *
     */
    BinaryPowerSwitch.prototype.setState = function (state) {
        if (state.switch) {
            this.on();
        } else {
            this.off();
        }
    };

    /**
     *
     */
    BinaryPowerSwitch.prototype.on = function () {
        this.logDebug("Called on()");

        if (this.isSimulated()) {

        } else {
            if (this.device.nodes[this.configuration.nodeId]) {
                this.device.zWave.setValue(this.configuration.nodeId, 37, 1, 0, true);

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
    BinaryPowerSwitch.prototype.off = function () {
        this.logDebug("Called off()");

        if (this.isSimulated()) {

        } else {
            if (this.device.nodes[this.configuration.nodeId]) {
                this.device.zWave.setValue(this.configuration.nodeId, 37, 1, 0, false);

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
    BinaryPowerSwitch.prototype.toggle = function () {
        if (this.state.switch) {
            this.off();
        } else {
            this.on();
        }
    };
};
