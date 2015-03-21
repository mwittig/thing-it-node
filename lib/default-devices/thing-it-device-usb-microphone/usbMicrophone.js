module.exports = {
    metadata: {
        family: "microphone",
        plugin: "usbMicrophone",
        label: "USB Microphone",
        tangible: true,
        actorTypes: [],
        sensorTypes: [],
        services: [],
        configuration: []
    },
    create: function (device) {
        return new UsbMicrophone();
    }
};

var utils = require("../../utils");
var q = require("q");
var fs = require("fs");

/**
 *
 */
function UsbMicrophone() {
    /**
     *
     */
    UsbMicrophone.prototype.start = function () {
        var deferred = q.defer();
        var self = this;

        this.state = {};

        if (self.isSimulated()) {
            deferred.resolve();
        } else {
            deferred.resolve();
        }

        return deferred.promise;
    };

    /**
     *
     */
    UsbMicrophone.prototype.pipeStream = function (req, res) {
        this.pipeFile(req, res, __dirname + "/data/spaceship.wav", "audio/wav");
    };

    /**
     *
     */
    UsbMicrophone.prototype.setState = function (state) {
        this.state = state;
    };

    /**
     *
     */
    UsbMicrophone.prototype.getState = function () {
        return this.state;
    };
}
