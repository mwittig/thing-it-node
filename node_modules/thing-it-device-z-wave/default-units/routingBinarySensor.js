module.exports = {
    metadata: {
        plugin: "routingBinarySensor",
        label: "Multilevel Sensor",
        role: "actor",
        family: "routingBinarySensor",
        deviceTypes: ["z-wave/zWaveNetwork"],
        services: [],
        state: [
            {
                id: "temperature", label: "Temperature",
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
            temperature: 0,
            luminecance: 0,
            relativeHumidity: 0,
            ultraviolet: 0
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
    RoutingBinarySensor.prototype.setStateFromZWave = function (comClass, value) {
        this.logDebug("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% State Change", comClass, value);
        if (comClass == 49) {
            //if (value.index == 1) {
            //    this.state.temperature = value.value;
            //}
            //else if (value.index == 3) {
            //    this.state.luminecance = value.value;
            //}
            //else if (value.index == 5) {
            //    this.state.relativeHumidity = value.value;
            //}
            //else if (value.index == 27) {
            //    this.state.ultraviolet = value.value;
            //}

            this.logDebug("State", this.state);
            this.publishStateChange();
        }
    };

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
