module.exports = {
    metadata: {
        plugin: "appleDevice",
        label: "Apple Device",
        family: "apple-device",
        configuration: [],
        actorTypes: [],
        sensorTypes: []
    },
    create: function (device) {
        return new AppleDevice();
    }
};

var utils = require("../../utils");
var q = require('q');

/**
 *
 */
function AppleDevice() {
    /**
     *
     */
    AppleDevice.prototype.start = function () {
        var deferred = q.defer();

        deferred.resolve();

        return deferred.promise;
    };

    /**
     *
     */
    AppleDevice.prototype.getState = function () {
        return {};
    };

    /**
     *
     */
    AppleDevice.prototype.setState = function () {
    };
}
