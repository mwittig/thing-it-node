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

var ON_STATE = 'poweredOn';

var HEART_RATE_VALUE_FORMAT = 1;

var HR_CHARACTERISTIC_HEARTRATE_UUID = '2a37';
var HR_CHARACTERISTIC_BODYSENSOR_UUID = '2a38';
var BATTERY_CHARACTERISTIC_LEVEL_UUID = '2a19';
var HR_SERVICE_HEARTRATE_UUID = '180d';
var BATTERY_SERVICE_UUID = '180f';
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
                console.log("Start Heart Rate Discovery");

                noble.on('discover', function (peripheral) {
                    console.log(peripheral.advertisement.localName);

                    if (peripheral.advertisement.localName &&
                        peripheral.uuid === this.uuid) {
                        console.log("\tFound configured Heart Rate " + peripheral.advertisement.localName);
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
                self.peripheral.discoverServices([
                    HR_SERVICE_HEARTRATE_UUID, BATTERY_SERVICE_UUID
                ], function (error, services) {
                    if (error) return self.emit('error', new Error(error));

                    handleHeartRateService(self, services);
                    handleBatteryService(self, services);
                });
            }
        }.bind(this));
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
