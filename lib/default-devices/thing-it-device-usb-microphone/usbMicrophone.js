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

        this.state = {clip: this.id + "-clip.wav"};

        if (self.isSimulated()) {
            try {
                fs.createReadStream(__dirname + '/data/spaceship.wav').pipe(fs.createWriteStream(this.node.options.dataDirectory + "/" + this.id + "-clip.wav"));

                deferred.resolve();
            } catch (error) {
                deferred.reject();
            }
        } else {
            deferred.resolve();
        }

        return deferred.promise;
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
