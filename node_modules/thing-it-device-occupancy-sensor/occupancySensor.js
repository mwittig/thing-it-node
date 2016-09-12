module.exports = {
    metadata: {
        family: 'occupancySensor',
        plugin: 'occupancySensor',
        label: 'Generic Occupancy Sensor',
        manufacturer: 'Generic',
        discoverable: false,
        tangible: true,
        additionalSoftware: [],
        actorTypes: [],
        sensorTypes: [],
        state: [{
            id: "occupation",
            label: "Occupation",
            type: {
                id: "boolean"
            }
        }],
        services: [],
        configuration: []
    },
    create: function () {
        return new OccupancySensor();
    },
    discovery: function () {
        return new OccupancySensorDiscovery();
    }
};

var q = require('q');
var _ = require('lodash');

function OccupancySensorDiscovery() {
    OccupancySensorDiscovery.prototype.start = function () {

        if (!this.node.isSimulated()) {
            // TODO For now, need to be able to switch for Discovery or inherit from Device
            this.logLevel = "debug";
        }
    };

    OccupancySensorDiscovery.prototype.stop = function () {
        if (discoveryInterval !== undefined && discoveryInterval) {
            clearInterval(discoveryInterval);
        }
    };

    OccupancySensorDiscovery.prototype.scanForProbe = function () {
    };
}

/**
 *
 * @constructor
 */
function OccupancySensor() {
    OccupancySensor.prototype.start = function () {
        var deferred = q.defer();

        this.state = {occupation: false};

        if (this.isSimulated()) {
            this.interval = setInterval(function () {
                this.state.occupation = new Date().getTime() % 2 == 0;

                this.publishStateChange();
            }.bind(this), 10000);

            deferred.resolve();
        } else {

            deferred.resolve();
        }

        return deferred.promise;
    };

    /**
     *
     */
    OccupancySensor.prototype.stop = function () {
        var deferred = q.defer();

        if (this.isSimulated()) {
            if (this.interval) {
                clearInterval(this.interval);
            }
        } else {
        }

        deferred.resolve();

        return deferred.promise;
    };

    /**
     *
     */
    OccupancySensor.prototype.getState = function () {
        return this.state;
    };

    /**
     *
     */
    OccupancySensor.prototype.setState = function () {
    };
}

