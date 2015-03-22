module.exports = {
    metadata: {
        family: "camera",
        plugin: "usbCamera",
        label: "USB Camera",
        tangible: true,
        actorTypes: [],
        sensorTypes: [],
        services: [],
        configuration: [{
            id: "inputDevice",
            label: "Input Device",
            type: {id: "string"},
            default: "0"
        }, {
            id: "inputFormat",
            label: "Input Format",
            type: {id: "string"},
            default: "avfoundation"
        }, {id: "bufferFiles", label: "Buffer Files", type: {id: "integer"}, default: "2"},
            {id: "videoWidth", label: "Video Width", type: {id: "integer"}, default: "320"}, {
                id: "videoHeight",
                label: "Video Height",
                type: {id: "integer"},
                default: "180"
            }, {
                id: "latency",
                label: "Latency",
                type: {id: "integer"},
                default: "5"
            }]
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

        this.state = {};

        if (this.isSimulated()) {
            deferred.resolve();

            setInterval(function () {
                this.state = {video: "" + new Date().getMilliseconds()};

                this.publishStateChange();
            }.bind(this), this.configuration.latency * 1000);
        } else {
            this.maxFiles = this.configuration.bufferFiles;
            this.videoSize = "" + this.configuration.videoWidth + "x" + this.configuration.videoHeight;
            this.fileIndex = 0;
            this.state = {video: "0"};

            this.streamChunk();

            deferred.resolve();
        }

        return deferred.promise;
    };

    /**
     *
     */
    UsbCamera.prototype.streamChunk = function () {
        ffmpeg().input(this.configuration.inputDevice).inputFormat(this.configuration.inputFormat)
            .duration(this.configuration.latency).size(this.videoSize)
            .on('end', function () {
                this.state = {video: "" + this.fileIndex};

                this.publishStateChange();

                this.fileIndex = (this.fileIndex + 1) % this.maxFiles;

                this.streamChunk();
            }.bind(this))
            .on('error', function (error) {
                console.error(error.message);
            }).save(this.getStreamingFilePath(this.fileIndex));
    };

    /**
     *
     */
    UsbCamera.prototype.getStreamingFilePath = function (stream) {
        if (this.isSimulated()) {
            //return __dirname + "/../../../" + this.node.options.dataDirectory + "/" + this.id + "-0.m4v";
            return __dirname + "/data/spaceship.m4v";

            deferred.resolve();
        } else {
            return __dirname + "/../../../" + this.node.options.dataDirectory + "/" + this.id + "-" + stream + ".m4v";
        }
    };

    /**
     *
     */
    UsbCamera.prototype.pipeStream = function (req, res, stream) {
        this.pipeFile(req, res, this.getStreamingFilePath(stream), "video/mp4");
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
