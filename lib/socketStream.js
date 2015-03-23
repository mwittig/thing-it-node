module.exports = {
    create: function (socket) {
        return new SocketStream().initialize(socket);
    }
};

var stream = require("stream");
var util = require("util");
var http = require("http");

function SocketStream() {
    stream.Writable.call(this);

    /**
     *
     * @param options
     */
    SocketStream.prototype.initialize = function (socket) {
        this.socket = socket;

        return this;
    };

    /**
     *
     * @param data
     * @param encoding
     * @param callback
     */
    SocketStream.prototype.write = function (data, encoding, callback) {
        this.socket.emit("data", {binary: data});

        if (typeof callback === "function") {
            callback();
        }
    };

    SocketStream.prototype.end = function () {
        //var args = Array.prototype.slice.apply(arguments);
        //if (args.length) that.write.apply(that, args);
        //that.destroy();
    };

    //SocketStream.prototype.destroySoon = this.destroy = function() {
    //    that.writable = false;
    //    that.emit("close");
    //};
}

util.inherits(SocketStream, stream.Writable);






