module.exports = {
    metadata: {
        family: "bluetooth-le",
        plugin: "bluetooth-le",
        label: "Bluetooth LE Device",
        manufacturer: "thing-it",
        connectionTypes: ["Internal"],
        actorTypes: [],
        sensorTypes: [],
        configuration: []
    },
    create: function (device) {
        return new BluetoothLE();
    }
};

var utils = require("../../utils");
var q = require('q');

/**
 * Requires https://nmap.org/download.html
 */
function BluetoothLE() {
    /**
     *
     */
    BluetoothLE.prototype.start = function () {
        var deferred = q.defer();
        var self = this;

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
    BluetoothLE.prototype.getState = function () {
        return {};
    };

    /**
     *
     */
    BluetoothLE.prototype.setState = function () {
    };
}
