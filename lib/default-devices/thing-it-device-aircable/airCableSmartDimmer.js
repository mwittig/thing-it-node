module.exports = {
    metadata: {
        family: "airCableSmartDimmer",
        plugin: "airCableSmartDimmer",
        label: "AirCable SmartDimmer",
        tangible: true,
        discoverable: true,
        actorTypes: [],
        sensorTypes: [],
        services: [{
            id: "on",
            label: "On"
        }, {
            id: "off",
            label: "Off"
        }, {
            id: "change",
            label: "Change"
        }],
        configuration: [{
            id: "minimum",
            label: "Minimum",
            type: {
                id: "integer"
            },
            defaultValue: 0
        }, {
            id: "maximum",
            label: "Maximum",
            type: {
                id: "integer"
            },
            defaultValue: 100
        }]
    },
    create: function (device) {
        return new AirCableSmartDimmer();
    },
    discovery: function (options) {
        var discovery = new AirCableSmartDimmer();

        discovery.options = options;

        return discovery;
    }
};

var utils = require("../../utils");
var q = require('q');
var noble = require('noble');

function AirCableSmartDimmerDiscovery() {
    /**
     *
     * @param options
     */
    AirCableSmartDimmerDiscovery.prototype.start = function () {
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

                    var drone = new AirCableSmartDimmer();

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
    AirCableSmartDimmerDiscovery.prototype.stop = function () {
        noble.stopScanning();
    };
}

/**
 *
 */
function AirCableSmartDimmer() {
    /**
     *
     */
    AirCableSmartDimmer.prototype.start = function () {
        var deferred = q.defer();

        this.state = {
            percentage: 0,
            batteryLevel: 100
        };

        if (this.isSimulated()) {
            deferred.resolve();
        } else {
            deferred.resolve();
        }

        return deferred.promise;
    };

    /**
     *
     */
    AirCableSmartDimmer.prototype.setState = function (state) {
        this.state = state;
    };

    /**
     *
     */
    AirCableSmartDimmer.prototype.getState = function () {
        return this.state;
    };

    /**
     *
     *
     */
    AirCableSmartDimmer.prototype.on = function () {
        if (this.isSimulated()) {
            this.state.percentage = 100;
        }
        else {
        }

        this.publishStateChange();
    };

    /**
     *
     *
     */
    AirCableSmartDimmer.prototype.off = function () {
        if (this.isSimulated()) {
            this.state.percentage = 0;
        }
        else {
        }

        this.publishStateChange();
    };

    /**
     *
     */
    AirCableSmartDimmer.prototype.change = function (parameters) {
        if (this.isSimulated()) {
            console.log("====> Change ", parameters);
            this.state.percentage =  Math.max(Math.min(parameters.value, 100), 0);
        }
        else {
        }

        this.publishStateChange();
    };

    /**
     *
     */
    AirCableSmartDimmer.prototype.down = function (options) {
        options = options || {};
        var step = options.step || 5;

        if (this.isSimulated()) {
            this.state.percentage = Math.max(this.state.percentage - step, 0);
        }
        else {
        }

        this.publishStateChange();
    };
}
