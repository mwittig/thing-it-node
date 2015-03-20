module.exports = {
    metadata: {
        plugin: "pairingAgent",
        label: "Default Actor for Apple DAAP/DACP Device",
        role: "actor",
        family: "pairingAgent",
        deviceTypes: ["apple-device/appleDevice"],
        state: [{
            id: "pairingCode",
            label: "Pairing GUID",
            type: {
                family: "primitive",
                id: "string"
            }
        }],
        configuration: [],
        services: [{
            id: "pair",
            label: "Pair"
        }]
    },
    create: function () {
        return new PairingAgent();
    }
};

var fs = require('fs');
var q = require('q');
var mdns = require('mdns');
var net = require('net');

/**
 * Based on the work of
 *
 * https://github.com/j-muller/pairingJS
 * http://jsharkey.org/blog/2009/06/21/itunes-dacp-pairing-hash-is-broken/
 * http://jinxidoru.blogspot.dk/2009/06/itunes-remote-pairing-code.html
 * https://github.com/agnat/node_mdns
 *
 */

// Some extra support function for Buffer object
Buffer.prototype.random = function (min, max) {
    return Math.floor((Math.random() * max) + min);
};

Buffer.prototype.toHexadecimal = function () {
    var result = '';
    var len = this.length;

    for (var i = 0; i < len; i++) {
        var byte = this.readUInt8(i).toString(16).toUpperCase();

        result += (byte.length < 2) ? '0' + byte : byte;
    }

    return result;
};

// JS implementation of Java nextBytes function

Buffer.prototype.nextBytes = function () {
    var len = this.length;

    for (var i = 0; i < len; i++) {
        this.writeUInt8(this.random(1, 255), i);
    }
};

// JS implementation of Java arraycopy function

Buffer.prototype.arraycopy = function (srcBuffer, srcPos, destPos, length) {
    srcBuffer.copy(this, destPos, srcPos, length);
};

function PairingAgent() {
    /**
     *
     */
    PairingAgent.prototype.start = function () {
        var deferred = q.defer();

        this.state = {
            pairingCode: "-"
        };

        if (!this.isSimulated()) {
            try {
                deferred.resolve();
            } catch (error) {
                this.device.node
                    .publishMessage("Cannot initialize "
                    + this.device.id + "/" + this.id
                    + ":" + error);
                deferred.reject(erro);
            }
        }
        else {
            deferred.resolve();
        }

        return deferred.promise;
    };

    /**
     *
     */
    PairingAgent.prototype.getState = function () {
        return this.state;
    };

    /**
     *
     */
    PairingAgent.prototype.setState = function (state) {
        this.state = state;
    };

    /**
     *
     */
    PairingAgent.prototype.pair = function () {
        var serviceType = "_touch-remote._tcp";
        var port = 1024;
        var txtRecord = {
            'DvNm': '[thing-it-node]',
            'RemV': '10000',
            'DvTy': 'iPod',
            'RemN': 'Remote',
            'txtvers': '1',
            'Pair': '0000000000000001'
        };

        // Advertise RemoteJS on the local network

        var ad = mdns.createAdvertisement(serviceType, port, {
            txtRecord: txtRecord
        });

        ad.start();

        // Start TCP server to interact with iTunes

        var pairingBytes = new Buffer([0x63, 0x6d, 0x70, 0x61, 0x00, 0x00,
            0x00, 0x3a, 0x63, 0x6d, 0x70, 0x67, 0x00, 0x00, 0x00, 0x08,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x63, 0x6d,
            0x6e, 0x6d, 0x00, 0x00, 0x00, 0x16, 0x41, 0x64, 0x6d, 0x69,
            0x6e, 0x69, 0x73, 0x74, 0x72, 0x61, 0x74, 0x6f, 0x72, 0xe2,
            0x80, 0x99, 0x73, 0x20, 0x69, 0x50, 0x6f, 0x64, 0x63, 0x6d,
            0x74, 0x79, 0x00, 0x00, 0x00, 0x04, 0x69, 0x50, 0x6f, 0x64]);

        var deferred = q.defer();
        var self = this;

        try {
            var server = net
                .createServer(
                function (socket) {

                    socket
                        .on(
                        'data',
                        function (data) {
                            var code = new Buffer(8);

                            code.nextBytes();
                            pairingBytes.arraycopy(
                                code, 0, 16, 8);

                            var header = new Buffer(
                                "HTTP/1.1 200 OK\r\nContent-Length: "
                                + pairingBytes.length
                                + "\r\n\r\n");
                            var reply = new Buffer(
                                header.length
                                + pairingBytes.length);

                            reply.arraycopy(header, 0,
                                0, header.length);
                            reply
                                .arraycopy(
                                pairingBytes,
                                0,
                                header.length,
                                pairingBytes.length);

                            socket.write(reply);

                            self.state.pairingCode = code
                                .toHexadecimal();
                            self.publishStateChange();

                            /*
                             * Stop advertisement and
                             * server
                             */
                            server.close();
                            ad.stop();

                            deferred.resolve();
                        });
                }).listen(port);
        } catch (error) {
            deferred.reject(error);
        }

        return deferred.promise;
    };
}
