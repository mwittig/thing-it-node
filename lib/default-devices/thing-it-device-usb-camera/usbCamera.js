module.exports = {
    metadata: {
        family: "camera",
        plugin: "usbCamera",
        label: "USB Camera",
        tangible: true,
        actorTypes: [],
        sensorTypes: [],
        services: [],
        configuration: []
    },
    create: function (device) {
        return new UsbCamera();
    }
};

var utils = require("../../utils");
var fs = require('fs');
var q = require('q');

/**
 *
 */
function UsbCamera() {
    /**
     *
     */
    UsbCamera.prototype.start = function () {
        var deferred = q.defer();
        var self = this;

        this.state = {clip: this.id + "-clip.m4v"};

        if (self.isSimulated()) {
            try {
                fs.createReadStream(__dirname + '/data/spaceship.m4v').pipe(fs.createWriteStream(this.node.options.dataDirectory + "/" + this.id + "-clip.m4v"));

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
    UsbCamera.prototype.setState = function (state) {
        this.state = state;
    };

    /**
     *
     */
    UsbCamera.prototype.getState = function () {
        return this.state;
    };
}
