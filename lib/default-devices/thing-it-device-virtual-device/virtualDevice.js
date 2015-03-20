module.exports = {
    metadata: {
        family: "virtual-device",
        plugin: "virtualDevice",
        label: "Virtual Device",
        dataTypes: {},
        actorTypes: [],
        sensorTypes: [],
        configuration: []
    },
    create: function (device) {
        return new VirtualDevice();
    }
};

var utils = require("../../utils");
var q = require('q');

/**
 *
 * @constructor
 */
function VirtualDevice() {
    /**
     *
     * @returns {promise|*|d.promise|Q.promise|n.ready.promise}
     */
    VirtualDevice.prototype.start = function () {
        var deferred = q.defer();

        deferred.resolve();

        return deferred.promise;
    };

    /**
     *
     */
    VirtualDevice.prototype.getState = function () {
        return {};
    };

    /**
     *
     */
    VirtualDevice.prototype.setState = function () {
    };
}
