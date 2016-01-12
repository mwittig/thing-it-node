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

        this.device.nodes[this.configuration.nodeId] = {unit: this};

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
    MultilevelSensor.prototype.stop = function () {
        var deferred = q.defer();

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
