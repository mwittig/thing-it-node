module.exports = {
    metadata: {
        family: "network",
        plugin: "network",
        label: "Network Utilities",
        manufacturer: "thing-it",
        connectionTypes: ["Internal"],
        actorTypes: [],
        sensorTypes: [],
        configuration: []
    },
    create: function (device) {
        return new Network();
    }
};

var utils = require("../../utils");
var q = require('q');

/**
 * Requires https://nmap.org/download.html
 */
function Network() {
    /**
     *
     */
    Network.prototype.start = function () {
        var deferred = q.defer();

        if (this.isSimulated()) {
            deferred.resolve();
        } else {
            deferred.resolve();
        }

        return deferred.promise;
    };

    /**
     *
     */
    Network.prototype.getState = function () {
        return {};
    };

    /**
     *
     */
    Network.prototype.setState = function () {
    };
}
