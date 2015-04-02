module.exports = {
    metadata: {
        family: "tiSensorTag",
        plugin: "tiSensorTag",
        label: "Texas Instruments (C) Sensor Tag",
        tangible: true,
        actorTypes: [],
        sensorTypes: [],
        services: [],
        configuration: []
    },
    create: function (device) {
        return new TISensorTag();
    },
    discovery: function (options) {
        var discovery = new TISensorTagDiscovery();

        discovery.options = options;

        return discovery;
    }
};

var utils = require("../../utils");
var q = require('q');
var noble = require('noble');

function TISensorTagDiscovery() {
    /**
     *
     * @param options
     */
    TISensorTagDiscovery.prototype.start = function () {
        if (this.node.isSimulated()) {
        } else {
            noble.on('discover', function (peripheral) {
                console.log("Local Name " + peripheral.advertisement.localName);

                if (
                    peripheral.advertisement.localName &&
                    peripheral.advertisement.localName.indexOf('SensorTag') === 0) {
                    console.log("Found a Sensor Tag");

                    // RegisterDrone somewhere

                    peripheral.connect(function () {
                        peripheral.discoverAllServicesAndCharacteristics(function (error, services, characteristics) {
                            var drone = new TISensorTag();

                            drone.peripheral = peripheral;
                            drone.services = services;
                            drone.characteristics = characteristics;

                            console.log("Peripheral, Services and Characteristics retrieved");

                            this.advertiseDevice(drone);
                        }.bind(this));
                    }.bind(this));
                }
            }.bind(this));

            noble.startScanning();
        }
    };

    /**
     *
     * @param options
     */
    TISensorTagDiscovery.prototype.stop = function () {
        noble.stopScanning();
    };
}

/**
 *
 */
function TISensorTag() {
    /**
     *
     */
    TISensorTag.prototype.start = function () {
        var deferred = q.defer();
        var self = this;

        this.state = {};

        if (self.isSimulated()) {
            deferred.resolve();
        } else {
            noble.on('discover', function (peripheral) {
                console.log("Local Name " + peripheral.advertisement.localName);

                if (peripheral.uuid === this.uuid) {
                    //this.peripheral = peripheral;
                    //this.peripheral.connect(onConnected);
                } else if ((typeof this.uuid) === 'undefined' &&
                    peripheral.advertisement.localName &&
                    peripheral.advertisement.localName.indexOf('SensorTag') === 0
                ) {
                    console.log("Found a Sensor Tag");

                    self.peripheral = peripheral;

                    self.peripheral.connect(function () {
                        noble.stopScanning();

                        console.log("Scanning stopped");

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
                }
            });

            noble.startScanning();

            console.log("Scanning started");

            deferred.resolve();
        }

        return deferred.promise;
    };

    /**
     *
     */
    TISensorTag.prototype.setState = function (state) {
        this.state = state;
    };

    /**
     *
     */
    TISensorTag.prototype.getState = function () {
        return this.state;
    };


    TISensorTag.prototype.getCharacteristic = function (unique_uuid_segment) {
        var filtered = this.characteristics.filter(function (c) {
            return c.uuid.search(new RegExp(unique_uuid_segment)) !== -1;
        });

        return filtered[0];
    };

    TISensorTag.prototype.writeTo = function (unique_uuid_segment, buffer) {
        this.getCharacteristic(unique_uuid_segment).write(buffer, true);
    };
}
