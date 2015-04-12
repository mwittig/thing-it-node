module.exports = {
    metadata: {
        family: "ardrone",
        plugin: "ardroneBluetoothLE",
        label: "AR Drone (Bluetooth LE)",
        tangible: true,
        discoverable: true,
        actorTypes: [],
        sensorTypes: [],
        services: [{
            id: "takeOff",
            label: "Take Off"
        }, {
            id: "land",
            label: "Land"
        }, {
            id: "emergencyStop",
            label: "Emergency Stop"
        }, {
            id: "up",
            label: "Up"
        }, {
            id: "down",
            label: "Down"
        }, {
            id: "forward",
            label: "Forward"
        }, {
            id: "backward",
            label: "Backward"
        }, {
            id: "turnClockwise",
            label: "Turn Clockwise", parameters: [{
                label: "angle",
                id: "Angle",
                type: {
                    id: "integer"
                }
            }]
        }],
        configuration: []
    },
    create: function (device) {
        return new ArDroneBluetoothLE();
    },
    discovery: function (options) {
        var discovery = new ArDroneBluetoothLEDiscovery();

        discovery.options = options;

        return discovery;
    }
};

var utils = require("../../utils");
var q = require('q');
var noble = require('noble');

var GUID_PATTERN = /([a-f0-9]{8})-?([a-f0-9]{4})-?([a-f0-9]{4})-?([a-f0-9]{4})-?([a-f0-9]{12})/;
var GUID_REPLACEMENT = "$1-$2-$3-$4-$5";

function ArDroneBluetoothLEDiscovery() {
    /**
     *
     * @param options
     */
    ArDroneBluetoothLEDiscovery.prototype.start = function () {
        if (this.node.isSimulated()) {
        } else {
            noble.on("discover", function (peripheral) {
                if (peripheral.advertisement.localName &&
                    peripheral.advertisement.localName.indexOf('RS_') === 0) {

                    console.log("Found a Rolling Spider " + peripheral.advertisement.localName);

                    if (peripheral.uuid) {
                        console.log("GUID " + peripheral.uuid.replace(GUID_PATTERN, GUID_REPLACEMENT));
                    }

                    console.log(peripheral.uuid);

                    var drone = new ArDroneBluetoothLE();

                    drone.peripheral = peripheral;
                    drone.uuid = peripheral.uuid;

                    this.advertiseDevice(drone);
                }
            }.bind(this));

            noble.startScanning();
        }
    };

    /**
     *
     * @param options
     */
    ArDroneBluetoothLEDiscovery.prototype.stop = function () {
        noble.stopScanning();
    };
}

/**
 *
 */
function ArDroneBluetoothLE() {
    /**
     *
     */
    ArDroneBluetoothLE.prototype.start = function () {
        var deferred = q.defer();

        this.state = {
            longitude: 0,
            latitude: 0,
            height: 0,
            batteryLevel: 100
        };

        if (this.isSimulated()) {
            deferred.resolve();
        } else {
            noble.on('discover', function (peripheral) {
                /*if (peripheral.uuid === this.uuid) {
                 //this.peripheral = peripheral;
                 //this.peripheral.connect(onConnected);
                 } else*/
                if ((typeof this.uuid) === 'undefined' &&
                    peripheral.advertisement.localName &&
                    peripheral.advertisement.localName.indexOf('RS_') === 0 &&
                    peripheral.uuid === this.uuid
                ) {
                    console.log("Found a registered Rolling Spider " + peripheral.advertisement.localName);
                    if (peripheral.uuid) {
                        console.log("GUID " + peripheral.uuid.replace(GUID_PATTERN, GUID_REPLACEMENT));
                    }

                    console.log(peripheral.uuid);

                    this.peripheral = peripheral;

                    noble.stopScanning();

                    this.connect();
                }
            }.bind(this));

            noble.startScanning();

            deferred.resolve();
        }

        return deferred.promise;
    };

    /**
     *
     */
    ArDroneBluetoothLE.prototype.connect = function () {
        this.peripheral.connect(function () {
            self.peripheral.discoverAllServicesAndCharacteristics(function (error, services, characteristics) {
                self.services = services;
                self.characteristics = characteristics;

                console.log("Services and characteristics retrieved");

                self.lastHandshake = new Date().getTime() - 3000;

                self.handshake().then(function () {
                    self.startPing().then(function () {
                    }).fail(function (error) {
                    });
                }).fail(function (error) {
                });
            });
        });
    };

    /**
     *
     */
    ArDroneBluetoothLE.prototype.setState = function (state) {
        this.state = state;
    };

    /**
     *
     */
    ArDroneBluetoothLE.prototype.getState = function () {
        return this.state;
    };

    /**
     *
     */
    ArDroneBluetoothLE.prototype.handshake = function () {
        var deferred = q.defer();

        // Only renew handshake if last is a while ago

        this.steps = {};

        this.getCharacteristic('fb0f').notify(true);
        this.getCharacteristic('fb0e').notify(true);
        this.getCharacteristic('fb1b').notify(true);
        this.getCharacteristic('fb1c').notify(true);
        this.getCharacteristic('fd22').notify(true);
        this.getCharacteristic('fd23').notify(true);
        this.getCharacteristic('fd24').notify(true);
        this.getCharacteristic('fd52').notify(true);
        this.getCharacteristic('fd53').notify(true);
        this.getCharacteristic('fd54').notify(true);

        var self = this;

        setTimeout(function () {
            self.steps['fa0b'] = (self.steps['fa0b'] || 0) + 1;

            self.getCharacteristic('fa0b').write(
                new Buffer([0x04, self.steps['fa0a'], 0x00, 0x04, 0x01, 0x00, 0x32, 0x30, 0x31, 0x34, 0x2D, 0x31, 0x30, 0x2D, 0x32, 0x38, 0x00]),
                true,
                function (error) {
                    console.log(error);

                    deferred.reject(error);
                }
            );

            deferred.resolve();
        }, 100);

        return deferred.promise;
    };

    ArDroneBluetoothLE.prototype.getCharacteristic = function (unique_uuid_segment) {
        var filtered = this.characteristics.filter(function (c) {
            return c.uuid.search(new RegExp(unique_uuid_segment)) !== -1;
        });

        return filtered[0];
    };

    ArDroneBluetoothLE.prototype.writeTo = function (unique_uuid_segment, buffer) {
        this.getCharacteristic(unique_uuid_segment).write(buffer, true);
    };

    ArDroneBluetoothLE.prototype.startPing = function () {
        var deferred = q.defer();

        setInterval(function () {
            this.steps['fa0a'] = (this.steps['fa0a'] || 0) + 1;

            this.writeTo(
                'fa0a',
                new Buffer([0x02, this.steps['fa0a'], 0x02, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])
            );

            deferred.resolve();
        }.bind(this), 50);

        return deferred.promise;
    };

//
// tilt [-100:100]
// forward [-100:100]
// turn [-100:100]
// up [-100:100]
//
    ArDroneBluetoothLE.prototype.drive = function (tilt, forward, turn, up, steps) {
        for (var i = 0; i < steps; i++) {
            this.steps['fa0a'] = (this.steps['fa0a'] || 0) + 1;

            var buffer = new Buffer(19);

            buffer.fill(0);
            buffer.writeInt16LE(2, 0);
            buffer.writeInt16LE(this.steps['fa0a'], 1);
            buffer.writeInt16LE(2, 2);
            buffer.writeInt16LE(0, 3);
            buffer.writeInt16LE(2, 4);
            buffer.writeInt16LE(0, 5);
            buffer.writeInt16LE(1, 6);
            buffer.writeInt16LE(tilt, 7);
            buffer.writeInt16LE(forward, 8);
            buffer.writeInt16LE(turn, 9);
            buffer.writeInt16LE(up, 10);
            buffer.writeFloatLE(0, 11);

            this.writeTo('fa0a', buffer);
        }
    };

    /**
     *
     *
     */
    ArDroneBluetoothLE.prototype.takeOff = function () {
        console.log("Drone.takeOff");

        if (this.isSimulated()) {
            this.state.height = 50;
        }
        else {
            this.steps['fa0b'] = (this.steps['fa0b'] || 0) + 1;

            this.writeTo(
                'fa0b',
                new Buffer([0x02, this.steps['fa0b'] & 0xFF, 0x02, 0x00, 0x01, 0x00])
            );
        }

        this.publishStateChange();
    };

    /**
     *
     */
    ArDroneBluetoothLE.prototype.land = function () {
        if (this.isSimulated()) {
            console.log("Drone.land");

            this.state.height = 0;
        }
        else {
            this.steps['fa0b'] = (this.steps['fa0b'] || 0) + 1;

            this.writeTo(
                'fa0b',
                new Buffer([0x02, this.steps['fa0b'] & 0xFF, 0x02, 0x00, 0x03, 0x00])
            );
        }

        this.publishStateChange();
    };

    /**
     *
     */
    ArDroneBluetoothLE.prototype.emergencyStop = function () {
        if (this.isSimulated()) {
            console.log("Drone.emergencyStop");

            this.state.height = 0;
        }
        else {
            this.steps['fa0c'] = (this.steps['fa0c'] || 0) + 1;

            this.writeTo(
                'fa0c',
                new Buffer([0x02, this.steps['fa0c'] & 0xFF, 0x02, 0x00, 0x04, 0x00])
            );
        }

        this.publishStateChange();
    };

    /**
     *
     */
    ArDroneBluetoothLE.prototype.turnClockwise = function () {
        if (this.isSimulated()) {
            console.log("Drone.turnClockwise");
        }

        this.publishStateChange();
    };

    /**
     *
     */
    ArDroneBluetoothLE.prototype.flatTrim = function () {
        this.steps['fa0b'] = (this.steps['fa0b'] || 0) + 1;
        this.writeTo(
            'fa0b',
            new Buffer([0x02, this.steps['fa0b'] & 0xFF, 0x02, 0x00, 0x00, 0x00])
        );

        this.publishStateChange();
    };

    /**
     *
     */
    ArDroneBluetoothLE.prototype.frontFlip = function () {
        this.steps['fa0b'] = (this.steps['fa0b'] || 0) + 1;
        this.writeTo(
            'fa0b',
            new Buffer([0x02, this.steps['fa0b'] & 0xFF, 0x02, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])
        );

        this.publishStateChange();
    };

    /**
     *
     */
    ArDroneBluetoothLE.prototype.backFlip = function () {
        this.steps['fa0b'] = (this.steps['fa0b'] || 0) + 1;
        this.writeTo(
            'fa0b',
            new Buffer([0x02, this.steps['fa0b'] & 0xFF, 0x02, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01])
        );

        this.publishStateChange();
    };

    /**
     *
     */
    ArDroneBluetoothLE.prototype.rightFlip = function () {
        this.steps['fa0b'] = (this.steps['fa0b'] || 0) + 1;

        this.writeTo(
            'fa0b',
            new Buffer([0x02, this.steps['fa0b'] & 0xFF, 0x02, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02])
        );

        this.publishStateChange();
    };

    /**
     *
     */
    ArDroneBluetoothLE.prototype.leftFlip = function () {
        this.steps['fa0b'] = (this.steps['fa0b'] || 0) + 1;

        this.writeTo(
            'fa0b',
            new Buffer([0x02, this.steps['fa0b'] & 0xFF, 0x02, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03])
        );

        this.publishStateChange();
    };

    /**
     *
     */
    ArDroneBluetoothLE.prototype.up = function (options) {
        options = options || {};
        var speed = options.speed || 50;
        var steps = options.steps || 50;

        if (this.isSimulated()) {
            this.state.height += steps;
        }
        else {
            this.drive(0, 0, 0, speed, steps);
        }

        this.publishStateChange();
    };

    /**
     *
     */
    ArDroneBluetoothLE.prototype.down = function (options) {
        options = options || {};
        var speed = options.speed || 50;
        var steps = options.steps || 50;

        if (this.isSimulated()) {
            this.state.height -= steps;
        }
        else {
            this.drive(0, 0, 0, speed * -1, steps);
        }

        this.publishStateChange();
    };

    /**
     *
     */
    ArDroneBluetoothLE.prototype.forward = function (options) {
        options = options || {};
        var speed = options.speed || 50;
        var steps = options.steps || 50;

        this.drive(0, speed, 0, 0, steps);

        this.publishStateChange();
    };

    /**
     *
     */
    ArDroneBluetoothLE.prototype.backward = function (options) {
        options = options || {};
        var speed = options.speed || 50;
        var steps = options.steps || 50;

        this.drive(0, speed * -1, 0, 0, steps);

        this.publishStateChange();
    };

    /**
     *
     */
    ArDroneBluetoothLE.prototype.turnRight = function (options) {
        options = options || {};
        var speed = options.speed || 50;
        var steps = options.steps || 50;

        this.drive(0, 0, speed, 0, steps);

        this.publishStateChange();
    };

    /**
     *
     */
    ArDroneBluetoothLE.prototype.turnLeft = function (options) {
        options = options || {};
        var speed = options.speed || 50;
        var steps = options.steps || 50;

        this.drive(0, 0, speed * -1, 0, steps);

        this.publishStateChange();
    };

    /**
     *
     */
    ArDroneBluetoothLE.prototype.tiltRight = function (options) {
        options = options || {};
        var speed = options.speed || 50;
        var steps = options.steps || 50;

        this.drive(speed, 0, 0, 0, steps);

        this.publishStateChange();
    };

    /**
     *
     */
    ArDroneBluetoothLE.prototype.tiltLeft = function
        (options) {
        options = options || {};
        var speed = options.speed || 50;
        var steps = options.steps || 50;

        this.drive(speed * -1, 0, 0, 0, steps);

        this.publishStateChange();
    };
}
