module.exports = {
    metadata: {
        family: "bacnet",
        plugin: "bacNetNetwork",
        label: "BACnet Network",
        manufacturer: "Generic",
        discoverable: true,
        actorTypes: [],
        sensorTypes: [],
        services: [],
        configuration: [{
            id: "host",
            label: "Host",
            type: {
                id: "string"
            },
            default: "255.255.255.255"
        }, {
            id: "userName",
            label: "User Name",
            type: {
                id: "string"
            }
        }, {
            id: "port",
            label: "Port",
            type: {
                id: "integer"
            },
            default: "8080"
        }, {
            id: "timeout",
            label: "Timeout",
            type: {
                id: "integer"
            },
            default: "20000"
        }]
    },
    create: function () {
        return new BacNetNetwork();
    },
    discovery: function () {
        return new BacNetNetworkDiscovery();
    }
};

var q = require('q');
var moment = require('moment');
var lightify;

const
    COMMAND_LIST_ALL_NODE = 0x13,
    COMMAND_LIST_ALL_ZONE = 0x1E,
    COMMAND_BRIGHTNESS = 0x31,
    COMMAND_ONOFF = 0x32,
    COMMAND_TEMP = 0x33,
    COMMAND_COLOR = 0x36,
    COMMAND_SOFT_ON = 0xDB,
    COMMAND_SOFT_OFF = 0xDC,
    COMMAND_GET_ZONE_INFO = 0x26,
    COMMAND_GET_STATUS = 0x68,
    COMMAND_ACTIVATE_SCENE = 0x52;

var groupCommands = [
    COMMAND_BRIGHTNESS,
    COMMAND_ONOFF,
    COMMAND_TEMP,
    COMMAND_COLOR,
    COMMAND_GET_STATUS
];

Buffer.prototype.getOurUTF8String = function (start, end) {
    for (var i = start; i < end && this[i] !== 0; i++) {
    }
    return this.toString('utf-8', start, i);
}

function defaultBuffer(mac, len) {
    if (len == undefined) len = 9;
    var body = new Buffer(len);
    body.fill(0);
    body.writeDoubleLE(mac, 0);
    return body;
}

function defaultResponseCallback(data, pos) {
    return {
        mac: data.readDoubleLE(pos, 8),
        success: data.readUInt8(pos + 8)
    };
}

/**
 *
 * @constructor
 */
function BacNetNetworkDiscovery() {
    /**
     *
     * @param options
     */
    BacNetNetworkDiscovery.prototype.start = function () {
        if (this.node.isSimulated()) {
            this.timer = setInterval(function () {
                var bacNetNetwork = new BacNetNetwork();

                bacNetNetwork.configuration = this.defaultConfiguration;
                bacNetNetwork.configuration.host = "129.168.192.10";
                bacNetNetwork.uuid = "129.168.192.10";

                bacNetNetwork.actors = [];

                bacNetNetwork.actors.push({
                    id: "lightBulb1", label: "Light Bulb 1", type: "lightBulb",
                    configuration: {
                        id: 1
                    }
                });

                this.advertiseDevice(bacNetNetwork);
            }.bind(this), 20000);
        } else {
            // TODO For now, need to be able to switch for Discovery or inherit from Device

            this.logLevel = "debug";

            this.connector = new UdpConnector();

            this.connector.connect(this.defaultConfiguration.host, this.defaultConfiguration.port).then(function () {
                this.connector.discovery().then(function (data) {
                    var bacNetNetwork = new BacNetNetwork();

                    bacNetNetwork.configuration = this.defaultConfiguration;
                    bacNetNetwork.uuid = this.defaultConfiguration.host;

                    bacNetNetwork.actors = [];

                    for (var n in data.result) {
                        if (data.result[n].type == 2) {
                            bacNetNetwork.actors.push({
                                id: 'lightBulb_' + doubleToMac(data.result[n].mac).replace(/:/g, '_'),
                                label: data.result[n].name,
                                type: "led",
                                configuration: {
                                    mac: doubleToMac(data.result[n].mac)
                                }
                            });
                        } else if (data.result[n].type == 10) {
                            bacNetNetwork.actors.push({
                                id: 'led_' + doubleToMac(data.result[n].mac).replace(/:/g, '_'),
                                label: data.result[n].name,
                                type: "lightBulb",
                                configuration: {
                                    mac: doubleToMac(data.result[n].mac)
                                }
                            });
                        }
                    }

                    this.logDebug("Bridge with lights", bacNetNetwork);

                    this.advertiseDevice(bacNetNetwork);
                }.bind(this)).fail(function (error) {
                    console.error(error);
                }.bind(this));
            }.bind(this)).fail(function (error) {
                console.error(error);
            }.bind(this));
        }
    };

    /**
     *
     * @param options
     */
    BacNetNetworkDiscovery.prototype.stop = function () {
        if (this.timer) {
            clearInterval(this.timer);
        }
    };
}

/**
 *
 * @constructor
 */
function BacNetNetwork() {
    /**
     *
     */
    BacNetNetwork.prototype.start = function () {
        var deferred = q.defer();

        if (this.isSimulated()) {
            deferred.resolve();
        } else {
            this.connector = new UdpConnector();

            this.connector.connect(this.configuration.host, this.configuration.port).then(function () {
                this.connector.discovery().then(function (data) {
                    //console.log('> ', data.result);
                    //console.log('> ', doubleToMac(data.result[0].mac));

                    deferred.resolve();
                }.bind(this)).fail(function (error) {
                    deferred.reject(error);
                }.bind(this));
            }.bind(this)).fail(function (error) {
                deferred.reject(error);
            }.bind(this));
        }

        return deferred.promise;
    };

    /**
     *
     */
    BacNetNetwork.prototype.stop = function () {
        var deferred = q.defer();

        deferred.resolve();

        return deferred.promise;
    };

    /**
     *
     */
    BacNetNetwork.prototype.getState = function () {
        return {};
    };

    /**
     *
     */
    BacNetNetwork.prototype.setState = function () {
    };
}

function UdpConnector() {
    UdpConnector.prototype.connect = function (host, port) {
        var deferred = q.defer();
        var net = require('net');

        this.commands = [];
        this.seq = 0;
        this.socket = new net.Socket();

        //connectTimer = setTimeout(function () {
        //    reject('timeout');
        //    client.destroy();
        //}, 1000);

        this.socket.on('data', function (data) {
            var seq = data.readUInt32LE(4);

            for (var i = 0; i < this.commands.length; i++) {
                if (this.commands[i].seq === seq) {
                    if (!this.commands[i].processor || !this.commands[i].processor(this.commands[i], data)) {
                        this.commands.splice(i, 1);
                    }

                    break;
                }
            }
        }.bind(this));

        this.socket.on('error', function (error) {
            deferred.resolve(error);
        }.bind(this));
        this.socket.connect(port, host, function () {
            //clearTimeout(connectTimer);
            deferred.resolve();
        }.bind(this));

        return deferred.promise;
    };

    UdpConnector.prototype.sendCommand = function (cmdId, body, flag, cb) {
        var deferred = q.defer();

        if (typeof flag == 'function') {
            cb = flag;
            flag = 0;
        }

        if (cb == undefined) cb = defaultResponseCallback;

        var cmd = this.createCommand(cmdId, body, flag)
            .setProcessor(function (_, data) {
                var fail = data.readUInt8(8);

                if (fail) {
                    console.error('ERROR', fail);
                    return deferred.reject(fail);
                }

                var num = data.readUInt16LE(9);

                if (num == 0) return deferred.reject(0);

                var result = {result: []};
                var statusLen = (data.length - 11) / num;

                for (var i = 0; i < num; i++) {
                    var pos = 11 + i * statusLen;
                    result.result.push(cb(data, pos));
                }

                if (true/*__DEBUG__*/) {
                    result.request = cmd.buffer.toString('hex');
                    result.response = data.toString('hex');
                }

                deferred.resolve(result);

                return result;
            });

        this.commands.push(cmd);
        this.socket.write(cmd.buffer);

        return deferred.promise;
    };

    UdpConnector.prototype.createCommand = function (cmd, body, flag) {
        if (flag == undefined && groupCommands.indexOf(cmd) >= 0) {
            for (var i = 1; i < 8 && body[i] == 0; i++);
            if (i == 8) flag = 2;
        }

        var buffer = new Buffer(8 + body.length);

        buffer.fill(0);
        buffer.writeUInt16LE(8 + body.length - 2, 0);// length
        buffer.writeUInt8(flag || 0x00, 2);          // Flag, 0:node, 2:zone
        buffer.writeUInt8(cmd, 3);                   // command
        buffer.writeUInt32LE(++this.seq, 4);              // request id
        body.copy(buffer, 8);

        return {
            seq: this.seq,
            buffer: buffer,
            createTime: moment().format('x'),
            setProcessor: function (cb) {
                this.processor = cb;
                return this;
            }
        };
    };

    UdpConnector.prototype.discovery = function () {
        return this.sendCommand(COMMAND_LIST_ALL_NODE, new Buffer([0x1]), function (data, pos) {
            return {
                id: data.readUInt16LE(pos),
                mac: data.readDoubleLE(pos + 2, 8),
                type: data.readUInt8(pos + 10),
                firmware_version: data.readUInt32BE(pos + 11),
                online: data.readUInt8(pos + 15),
                groupid: data.readUInt16LE(pos + 16),
                status: data.readUInt8(pos + 18), // 0 == off, 1 == on
                brightness: data.readUInt8(pos + 19),
                temperature: data.readUInt16LE(pos + 20),
                red: data.readUInt8(pos + 22),
                green: data.readUInt8(pos + 23),
                blue: data.readUInt8(pos + 24),
                alpha: data.readUInt8(pos + 25),
                name: data.getOurUTF8String(pos + 26, pos + 50)
            };
        });
    }

    UdpConnector.prototype.nodeOnOff = function (mac, on) {
        var deferred = q.defer();
        var body = defaultBuffer(macToDouble(mac), 10);

        body.writeUInt8(on ? 1 : 0, 8);

        this.sendCommand(COMMAND_ONOFF, body);

        return deferred.promise;
    }

    UdpConnector.prototype.nodeSoftOnOff = function (mac, on, transitiontime) {
        var deferred = q.defer();
        var body = defaultBuffer(macToDouble(mac), 10);

        body.writeUInt16LE(transitiontime || 0, 8);

        this.sendCommand(on ? COMMAND_SOFT_ON : COMMAND_SOFT_OFF, body, 0, function(){
            deferred.resolve();
        });

        return deferred.promise;
    };

    UdpConnector.prototype.nodeBrightness = function(mac, brightness, stepTime) {
        var deferred = q.defer();
        var buffer = defaultBuffer(macToDouble(mac), 11);

        buffer.writeUInt8(brightness, 8);
        buffer.writeUInt16LE(stepTime || 0, 9);

        this.sendCommand(COMMAND_BRIGHTNESS, buffer, 0, function(){
            deferred.resolve();
        });

        return deferred.promise;
    };

    UdpConnector.prototype.nodeTemperature = function(mac, temperature, stepTime) {
        var deferred = q.defer();
        var buffer = defaultBuffer(macToDouble(mac), 12);

        buffer.writeUInt16LE(temperature, 8);
        buffer.writeUInt16LE(step_time || 0, 10);

        this.sendCommand(COMMAND_TEMP, buffer, 0, function(){
            deferred.resolve();
        });

        return deferred.promise;
    };

    UdpConnector.prototype.nodeColor = function(mac, red, green, blue, alpha, stepTime) {
        var deferred = q.defer();
        var buffer = defaultBuffer(macToDouble(mac), 14);

        buffer.writeUInt8(red, 8);
        buffer.writeUInt8(green, 9);
        buffer.writeUInt8(blue, 10);
        buffer.writeUInt8(alpha, 11);
        buffer.writeUInt16LE(stepTime || 0, 12);

        this.sendCommand(COMMAND_COLOR, buffer, 0, function(){
            deferred.resolve();
        });

        return deferred.promise;
    };
}

function doubleToMac(double) {
    var buffer = new Buffer(8);
    var mac = '';

    buffer.writeDoubleLE(double);

    for (var n = 0; n < 8; ++n) {
        if (n > 0) {
            mac += ':';
        }

        mac += uint8ToHex(buffer.readUInt8(n));
    }

    return mac;
}

function macToDouble(mac) {
    var segments = mac.split(':');
    var buffer = new Buffer(8);

    for (var n = 0; n < segments.length; ++n) {
        buffer.writeUInt8(parseInt(segments[n], 16), n);
    }

    return buffer.readDoubleLE(buffer, 0);
}

function uint8ToHex(number) {
    var str = number.toString(16);

    while (str.length < 2) str = '0' + str;

    return str;
}
