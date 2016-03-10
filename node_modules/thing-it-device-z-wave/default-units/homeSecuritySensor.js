module.exports = {
    metadata: {
        plugin: "homeSecuritySensor",
        label: "Z-Wave Generic Device",
        role: "actor",
        family: "homeSecuritySensor",
        deviceTypes: ["z-wave/zWaveNetwork"],
        services: [],
        state: [
            {
                id: "motionDetected", label: "Motion Detected",
                type: {
                    id: "boolean"
                }
            }, {
                id: "fahrenheit", label: "Temperature",
                type: {
                    id: "decimal"
                }
            }, {
                id: "celsius", label: "Temperature",
                type: {
                    id: "decimal"
                }
            }, {
                id: "temperature", label: "Temperature",
                type: {
                    id: "decimal"
                }
            }, {
                id: "luminance", label: "Luminance",
                type: {
                    id: "decimal"
                }
            }, {
                id: "relativeHumidity", label: "Relative Humidity",
                type: {
                    id: "decimal"
                }
            }
        ],
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
            {
                label: "Unit",
                id: "unit",
                type: {
                    id: "string"
                },
                defaultValue: "celsius"
            },
        ]
    },
    create: function () {
        return new HomeSecuritySensor();
    }
};

var q = require('q');

/**
 *
 */
function HomeSecuritySensor() {
    /**
     *
     */
    HomeSecuritySensor.prototype.start = function () {
        var deferred = q.defer();

        this.state = {
            motionDetected: false,
            temperature: 0,
            luminance: 0,
            relativeHumidity: 0,
        };

        if (!(this.configuration.unit == "Celsius") && !(this.configuration.unit == "Fahrenheit")) {
            this.logDebug("No unit set, defaulting to celsius.");
            this.configuration.unit = "Celsius";
        } else {
            this.logDebug("Unit set to: ", this.configuration.unit);
        }

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
    HomeSecuritySensor.prototype.setStateFromZWave = function (comClass, value) {
        if (comClass == 49) {
            if (value.label == "Temperature") {
                if (value.units == "F") {
                    this.state.fahrenheit = parseFloat(value.value);

                    if (this.configuration.unit == "Fahrenheit"){
                        this.state.temperature = this.state.fahrenheit;
                    }
                } else if (value.units == "C") {
                    this.state.celsius = parseFloat(value.value);

                    if (this.configuration.unit == "Celsius"){
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

            this.logDebug("State", this.state);
            this.publishStateChange();
        }
    };

    /**
     *
     */
    HomeSecuritySensor.prototype.handleEventFromZWave = function (event, valueid) {
        if (255 == event) {
            this.logDebug("Event - motion detected");
            this.state.motionDetected = true;
        } else if (0 == event) {
            this.logDebug("Event - no more motion detected");
            this.state.motionDetected = false;
        }

        this.publishStateChange();
    }

    /**
     *
     */
    HomeSecuritySensor.prototype.handleNotificationFromZWave = function (notif, help) {
        this.logDebug(help + " (" + notif + ")"
            + " on node id " + this.configuration.nodeId + " with device type " + this.configuration.deviceType + ".");
    }

    /**
     *
     */
    HomeSecuritySensor.prototype.scanComplete = function () {
        this.logDebug("Received scan complete on node id " + this.configuration.nodeId + " with device type "
            + this.configuration.deviceType + ".");
        this.logDebug("Polling Frequency (ms): " + this.device.zWave.getPollInterval());
        this.device.zWave.enablePoll(this.configuration.nodeId, 49);
    };

    /**
     *
     */
    HomeSecuritySensor.prototype.stop = function () {
        var deferred = q.defer();

        deferred.resolve();

        return deferred.promise;
    };

    /**
     *
     */
    HomeSecuritySensor.prototype.getState = function () {
        return this.state;
    };

    /**
     *
     */
    HomeSecuritySensor.prototype.setState = function (state) {
    };
};
