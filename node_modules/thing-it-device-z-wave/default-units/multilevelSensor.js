module.exports = {
    metadata: {
        plugin: "multilevelSensor",
        label: "Multilevel Sensor",
        role: "actor",
        family: "multilevelSensor",
        deviceTypes: ["z-wave/zWaveNetwork"],
        services: [],
        state: [
            {
                id: "temperature", label: "Temperature",
                type: {
                    id: "decimal"
                }
            }, {
                id: "luminecance", label: "Luminecance",
                type: {
                    id: "decimal"
                }
            },
            {
                id: "relativeHumidity", label: "Relative Humidity",
                type: {
                    id: "decimal"
                }
            }, {
                id: "ultraviolet", label: "Ultraviolet",
                type: {
                    id: "decimal"
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
        return new MultilevelSensor();
    }
};

var q = require('q');

/**
 *
 */
function MultilevelSensor() {
    /**
     *
     */
    MultilevelSensor.prototype.start = function () {
        var deferred = q.defer();

        this.state = {
            temperature: 0,
            luminecance: 0,
            relativeHumidity: 0,
            ultraviolet: 0
        };

        if (this.isSimulated()) {
            this.simulationInterval = setInterval(function () {
                this.state = {
                    temperature: Math.round(15 + 10 * Math.random()),
                    luminecance: Math.round(1000 - 500 * Math.random()),
                    relativeHumidity: Math.round(100 - 30 * Math.random()),
                    ultraviolet: Math.round(1000 - 500 * Math.random())
                };

                this.publishStateChange();
            }.bind(this), 20000);
        } else {
            this.device.nodes[this.configuration.nodeId] = {unit: this};
        }

        deferred.resolve();

        return deferred.promise;
    };

    /**
     *
     */
    MultilevelSensor.prototype.setStateFromZWave = function (comClass, value) {
        if (comClass == 49) {
            if (value.index == 1) {
                this.state.temperature = value.value;
            }
            else if (value.index == 3) {
                this.state.luminecance = value.value;
            }
            else if (value.index == 5) {
                this.state.relativeHumidity = value.value;
            }
            else if (value.index == 27) {
                this.state.ultraviolet = value.value;
            }

            this.logDebug("State", this.state);
            this.publishStateChange();
        }
    };

    /**
     *
     */
    MultilevelSensor.prototype.handleEventFromZWave = function (event, valueid) {
        this.logDebug("Event: " + event + " on Value ID " + valueid);
    }

    /**
     *
     */
    MultilevelSensor.prototype.handleNotificationFromZWave = function (notif, help) {
        this.logDebug(help + " (" + notif + ")");
    }

    /**
     *
     */
    MultilevelSensor.prototype.stop = function () {
        var deferred = q.defer();

        if (this.isSimulated() && this.simulationInterval) {
            clearInterval(this.simulationInterval);
        }

        deferred.resolve();

        return deferred.promise;
    };

    /**
     *
     */
    MultilevelSensor.prototype.getState = function () {
        return this.state;
    };

    /**
     *
     */
    MultilevelSensor.prototype.setState = function (state) {
    };
};
