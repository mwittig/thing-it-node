module.exports = {
    metadata: {
        plugin: "genericDevice",
        label: "Z-Wave Generic Device",
        role: "actor",
        family: "genericDevice",
        deviceTypes: ["z-wave/zWaveNetwork"],
        services: [],
        state: [{
            id: "batteryLevel", label: "Battery Level",
            type: {
                id: "integer"
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
                label: "DeviceType",
                id: "deviceType",
                type: {
                    id: "string"
                },
                defaultValue: ""
            },
        ]
    },
    create: function () {
        return new GenericDevice();
    }
};

var q = require('q');

/**
 *
 */
function GenericDevice() {
    /**
     *
     */
    GenericDevice.prototype.start = function () {
        var deferred = q.defer();

        this.state = {
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
    GenericDevice.prototype.setStateFromZWave = function (comClass, value) {
        if (comClass == 48) {
            this.state.motionDetected = value.value;
            this.logInfo("Update", value.value_id, value.label, value.value);
            this.logDebug("State", this.state);
            this.publishStateChange();
        } else if (comClass == 49) {
            if (value.label == "Temperature") {
                if (value.units == "F") {
                    this.state.fahrenheit = parseFloat(value.value);

                    if (this.configuration.unit == "Fahrenheit") {
                        this.state.temperature = this.state.fahrenheit;
                    }
                } else if (value.units == "C") {
                    this.state.celsius = parseFloat(value.value);

                    if (this.configuration.unit == "Celsius") {
                        this.state.temperature = this.state.celsius;
                    }
                }
            } else if (value.label == "Luminance") {
                this.state.luminance = parseFloat(value.value);
            } else if (value.label == "Relative Humidity") {
                this.state.relativeHumidity = parseFloat(value.value);
            } else {
                this.logDebug("Ignoring state update.", value.label, value.value);
            }

            this.logInfo("Update", value.value_id, value.label, value.value);
            this.logDebug("State", this.state);
            this.publishStateChange();
        } else if (comClass == 128) {
            this.state.batteryLevel = value.value;
            this.logInfo("Update", value.value_id, value.label, value.value);
            this.logDebug("State", this.state);
            this.publishStateChange();
        } else if (comClass == 134) {
            this.logDebug("Version Info: " + value.label + " " + value.value + " (valueid " + value.value_id + ")");
        } else if (comClass == 94) {
            this.logDebug("Z-Wave Plus Info: " + value.label + " " + value.value + " (valueid " + value.value_id + ")");
        } else if (comClass == 115) {
            this.logDebug("Powerlevel Info: " + value.label + " " + value.value + " (valueid " + value.value_id + ")");
        } else if (comClass == 113) {
            // Info not helpful, redundant to notification with less info.
            // this.logDebug("Alarm Info: " + value.label + " " + value.value + " (valueid " + value.value_id + ")");
        } else if (comClass == 132) {
            this.logDebug("Wake Up Info: " + value.label + " " + value.value + " (valueid " + value.value_id + ")");

            if ((value.value_id == this.configuration.nodeId + "-132-1-0") && (value.value != 240)) {
                this.device.zWave.setValue(this.configuration.nodeId, 132, 1, 0, 240);
            }
        } else if (comClass == 32) {
            this.logDebug("Basic: " + value.label + " " + value.value + " (valueid " + value.value_id + ")");
        } else {
            this.logDebug("Unhandled comClass " + comClass + " with value label " + value.label + " and value "
                + value.value + " (valueid " + value.value_id + ")");
            this.logDebug(value);
        }

    };

    /**
     *
     */
    GenericDevice.prototype.handleEventFromZWave = function (event, valueid) {
        this.logDebug("Event: " + event + " on Value ID " + valueid
            + " on node id " + this.configuration.nodeId + " with device type " + this.configuration.deviceType + ".");
    }

    /**
     *
     */
    GenericDevice.prototype.handleNotificationFromZWave = function (notif, help) {
        this.logDebug(help + " (" + notif + ")"
            + " on node id " + this.configuration.nodeId + " with device type " + this.configuration.deviceType + ".");

        if ((notif == 3) || (notif == 4) || (notif == 6)) {
            try {
                this.device.zWave.requestAllConfigParams(this.configuration.nodeId);
                this.device.zWave.setValue(this.configuration.nodeId, 132, 1, 0, 240);
                this.device.zWave.enablePoll(this.configuration.nodeId, 49);
            } catch (e) {
                this.logDebug(e);
            }
        }
    }

    /**
     *
     */
    GenericDevice.prototype.scanComplete = function () {
        this.logDebug("Received scan complete on node id " + this.configuration.nodeId + " with device type "
            + this.configuration.deviceType + ".");
        this.logDebug("####################################");
        this.logDebug("Polling Frequency (ms): " + this.device.zWave.getPollInterval());
        this.logDebug("Groups: " + this.device.zWave.getNumGroups(this.configuration.nodeId));
        this.device.zWave.requestAllConfigParams(this.configuration.nodeId);
        this.device.zWave.enablePoll(this.configuration.nodeId, 49);
        this.device.zWave.addAssociation(this.configuration.nodeId, 0, 1);
        this.logDebug("####################################");
    };

    /**
     *
     */
    GenericDevice.prototype.stop = function () {
        var deferred = q.defer();

        deferred.resolve();

        return deferred.promise;
    };

    /**
     *
     */
    GenericDevice.prototype.getState = function () {
        return this.state;
    };

    /**
     *
     */
    GenericDevice.prototype.setState = function (state) {
    };
};
