module.exports = {
    metadata: {
        family: "heartRateMonitor",
        plugin: "heartRateMonitor",
        label: "Heart Rate Monitor",
        manufacturer: "Generic",
        tangible: true,
        discoverable: true,
        state: [{
            id: "heartrate",
            label: "HeartRate",
            type: {
                id: "number"
            }
        }],
        actorTypes: [],
        sensorTypes: [],
        services: [],
        configuration: []
    },
    create: function (device) {
        return new HeartRateMonitor();
    },
    discovery: function (options) {
        var discovery = new HeartRateMonitorDiscovery();

        discovery.options = options;

        return discovery;
    }
};

var utils = require("../../utils");
var q = require('q');
var noble = require('noble');

var GUID_PATTERN = /([a-f0-9]{8})-?([a-f0-9]{4})-?([a-f0-9]{4})-?([a-f0-9]{4})-?([a-f0-9]{12})/;
var GUID_REPLACEMENT = "$1-$2-$3-$4-$5";

var HEART_RATE_UUID_SERVICE = "f000aa10-0451-4000-b000-000000000000"; // TODO Correct values
var HEART_RATE_UUID_DATA = /^f000aa11-0451-4000-b000-000000000000$/; // TODO Correct values
var HEART_RATE_UUID_CONF = "f000aa12-0451-4000-b000-000000000000"; // TODO Correct values
var HEART_RATE_UUID_PERIOD = "f000aa13-0451-4000-b000-000000000000"; // TODO Correct values
var HR_CHARACTERISTIC_BODYSENSOR_UUID = '2a38';
var HR_CHARACTERISTIC_HEARTRATE_UUID = '2a37';

var BATTERY_LEVEL_UUID_SERVICE = "f000aa10-0451-4000-b000-000000000000"; // TODO Correct values
var BATTERY_LEVEL_UUID_DATA = /^f000aa11-0451-4000-b000-000000000000$/; // TODO Correct values
var BATTERY_LEVEL_UUID_CONF = "f000aa12-0451-4000-b000-000000000000"; // TODO Correct values
var BATTERY_LEVEL_UUID_PERIOD = "f000aa13-0451-4000-b000-000000000000"; // TODO Correct values
var BATTERY_SERVICE_UUID = '180f';
var BATTERY_CHARACTERISTIC_LEVEL_UUID = '2a19';

var HEART_RATE_VALUE_FORMAT = 1;
var BODY_LOCATION_STRINGS = ['Other', 'Chest', 'Wrist',
    'Finger', 'Hand', 'Ear Lobe', 'Foot'];

function HeartRateMonitorDiscovery() {
    /**
     *
     * @param options
     */
    HeartRateMonitorDiscovery.prototype.start = function () {
        if (this.node.isSimulated()) {
        } else {
            noble.on('discover', function (peripheral) {
                if (peripheral.advertisement.localName &&
                    peripheral.advertisement.localName.indexOf('SensorTag') === 0) {

                    console.log("Found Heart Rate Monitor " + peripheral.advertisement.localName);
                    console.log("\tUUID " + peripheral.uuid);

                    if (peripheral.uuid) {
                        console.log("GUID " + peripheral.uuid.replace(GUID_PATTERN, GUID_REPLACEMENT));
                    }

                    var heartRateMonitor = new HeartRateMonitor();

                    heartRateMonitor.peripheral = peripheral;
                    heartRateMonitor.uuid = peripheral.uuid;

                    this.advertiseDevice(heartRateMonitor);
                }
            }.bind(this));

            noble.startScanning();
        }
    };

    /**
     *
     * @param options
     */
    HeartRateMonitorDiscovery.prototype.stop = function () {
        noble.stopScanning();
    };
}

/**
 *
 */
function HeartRateMonitor() {
    /**
     *
     */
    HeartRateMonitor.prototype.start = function () {
        var deferred = q.defer();

        this.state = {
            heartRate: null,
            bodyLocation: null,
            batteryLevel: null
        };

        if (this.peripheral) {
            this.connect();

            deferred.resolve();
        }
        else {
            if (!this.isSimulated()) {
                console.log("Start Heart Rate Monitor Discovery");

                noble.on('discover', function (peripheral) {
                    console.log(peripheral.advertisement.localName);

                    if (peripheral.advertisement.localName &&
                        peripheral.uuid === this.uuid) {
                        console.log("\tFound configured Heart Rate Monitor " + peripheral.advertisement.localName);
                        console.log("\tUUID " + peripheral.uuid);

                        if (peripheral.uuid) {
                            console.log("\tGUID " + peripheral.uuid.replace(GUID_PATTERN, GUID_REPLACEMENT));
                        }

                        this.peripheral = peripheral;

                        noble.stopScanning();

                        this.connect();
                    }
                }.bind(this));

                noble.startScanning();

                console.log("\tScanning started");

                deferred.resolve();
            } else {
                deferred.resolve();
            }
        }

        return deferred.promise;
    };

    /**
     *
     */
    HeartRateMonitor.prototype.connect = function () {
        this.peripheral.connect(function (error) {
            if (error) {
                console.log(error);
            } else {
                peripheral.discoverAllServicesAndCharacteristics(function (error, services, characteristics) {
                    for (var n = 0; n < services.length; ++n) {
                        var guid =
                            services[n].uuid.replace(Constants.GUID_PATTERN, Constants.GUID_REPLACEMENT);

                        switch (guid) {
                            case HEART_RATE_UUID_SERVICE:
                                this.heartRateService = services[n];
                                break;
                            case BATTERY_LEVEL_UUID_SERVICE:
                                this.heartRateService = services[n];
                                break;
                        }
                    }

                    for (var n = 0; n < characteristics.length; ++n) {
                        var guid =
                            characteristics[n].uuid.replace(Constants.GUID_PATTERN, Constants.GUID_REPLACEMENT);

                        switch (guid) {
                            case HEART_RATE_UUID_DATA:
                                this.heartRateDataCharacteristic = characteristics[n];
                                break;
                            case BATTERY_LEVEL_UUID_DATA:
                                this.batteryLevelCharacteristic = characteristics[n];
                                break;
                            case HR_CHARACTERISTIC_BODYSENSOR_UUID:
                                this.bodyLocationCharacteristic = characteristics[n];
                                break;
                        }
                    }

                    this.heartRateDataCharacteristic.notify(true);
                    this.heartRateDataCharacteristic.read(function (error, data) {
                        if (error) {
                        }

                        var flags = data.readUInt8(0);

                        if (!((flags & HEART_RATE_VALUE_FORMAT) != HEART_RATE_VALUE_FORMAT)) {
                            return;
                        }

                        this.state.heartRate = data.readUInt8(1);

                        this.getBodySensorData(function (error, bodyLocation) {
                            if (error) {
                                console.error(error);
                            }
                            else {
                                this.state.bodyLocation = bodyLocation;

                                this.publishStateChange();
                            }
                        }.bind(this));
                    });
                    this.batteryLevelCharacteristic.notify(true)
                    this.batteryLevelCharacteristic.read(function (error, data) {
                        if (error) {
                            console.error(error);
                        }
                        else {
                            this.state.batteryLevel = data.readUInt8(0);

                            this.publishStateChange();
                        }
                    });
                }.bind(this));
            }
        }.bind(this));
    };

    HeartRateMonitor.prototype.getBodySensorData = function (callback) {
        this.bodyLocationCharacteristic.read(function (error, data) {
            if (error) return callback(error);

            callback(null, this.bodyLocationToString(data.readUInt8(0)));
        });
    };

    HeartRateMonitor.prototype.bodyLocationToString = function (location) {
        if (!BODY_LOCATION_STRINGS[location]) {
            return BODY_LOCATION_STRINGS[0];
        }

        return BODY_LOCATION_STRINGS[location];
    };

    /**
     *
     */
    HeartRateMonitor.prototype.setState = function (state) {
        this.state = state;
    };

    /**
     *
     */
    HeartRateMonitor.prototype.getState = function () {
        return this.state;
    };
}
