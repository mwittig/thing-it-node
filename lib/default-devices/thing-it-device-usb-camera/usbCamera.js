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
var q = require('q');
var ffmpeg = require("fluent-ffmpeg");

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
    UsbCamera.prototype.pipeStream = function (req, res) {
        this.pipeFile(req, res, __dirname + "/data/spaceship.m4v", "video/mp4");
        //this.pipeFile(req, res, "/Users/marcgille/out.mp4", "video/mp4");

        // res.contentType('flv');

        //var proc = ffmpeg("/Users/marcgille/out.mpg")
        //    // use the 'flashvideo' preset (located in /lib/presets/flashvideo.js)
        //    .preset('flashvideo')
        //    // setup event handlers
        //    .on('end', function () {
        //        console.log('file has been converted succesfully');
        //    })
        //    .on('error', function (err) {
        //        console.log('an error happened: ' + err.message);
        //    })
        //    // save to stream
        //    .pipe(res, {end: true});
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
