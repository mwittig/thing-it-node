module.exports = {
    metadata : {
        family : "bluetooth-le",
        plugin : "bluetooth-le",
        label : "Bluetooth LE Device",
        manufacturer : "thing-it",
        connectionTypes : [ "Internal" ],
        actorTypes : [],
        sensorTypes : [],
        configuration : []
    },
    create : function(device) {
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
    BluetoothLE.prototype.start = function() {
        var deferred = q.defer();
        var self = this;

        if (this.isSimulated()) {
            self.startDevice().then(function() {
                console.log("Bluetooth LE started.");
                deferred.resolve();
            }).fail(function() {
                deferred.reject();
            });
        } else {
            self.startDevice().then(function() {
                console.log("Bluetooth LE started.");
                deferred.resolve();
            }).fail(function() {
                deferred.reject();
            });
        }

        return deferred.promise;
    };
}
