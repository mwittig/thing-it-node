module.exports = {
    metadata: {
        family: 'pHMeter',
        plugin: 'pHMeter',
        label: 'Atlas Scientific pH Meter',
        manufacturer: 'Atlas Scientific',
        discoverable: false,
        tangible: true,
        additionalSoftware: [],
        actorTypes: [],
        sensorTypes: [],
        state: [{
            id: "pHValue",
            label: "pH Value",
            type: {
                id: "decimal"
            }
        }, {
            id: "calibrationHigh",
            label: "Calibration High",
            type: {
                id: "decimal"
            }
        }, {
            id: "calibrationMiddle",
            label: "Calibration Middle",
            type: {
                id: "decimal"
            }
        }, {
            id: "calibrationLow",
            label: "Calibration Low",
            type: {
                id: "decimal"
            }
        }],
        services: [{
            id: "calibrateHigh", label: "Calibrate High", parameters: [{
                id: "value", label: "Value", type: {id: "decimal"}
            }]
        },
            {
                id: "calibrateMiddle", label: "Calibrate Middle", parameters: [{
                id: "value", label: "Value", type: {id: "decimal"}
            }]
            },
            {
                id: "calibrateLow", label: "Calibrate Low", parameters: [{
                id: "value", label: "Value", type: {id: "decimal"}
            }]
            }, {
                id: "setI2CAddress", label: "Set I2C Address", parameters: [{
                    id: "address", label: "Address", type: {id: "string"}
                }]
            }],
        configuration: [{
            id: "i2CAddress", label: "I2C Address", type: {id: "string"}
        }]
    },
    create: function () {
        return new pHMeter();
    },
    discovery: function () {
        return new pHMeterDiscovery();
    }
};

var q = require('q');
var _ = require('lodash');

function pHMeterDiscovery() {
    pHMeterDiscovery.prototype.start = function () {

        if (!this.node.isSimulated()) {
            // TODO For now, need to be able to switch for Discovery or inherit from Device
            this.logLevel = "debug";
            this.scanForCameras();
            this.discoveryInterval = setInterval(this.scanForProbe.bind(this), 30000);
        }
    };

    pHMeterDiscovery.prototype.stop = function () {
        if (discoveryInterval !== undefined && discoveryInterval) {
            clearInterval(discoveryInterval);
        }
    };

    pHMeterDiscovery.prototype.scanForProbe = function () {
    };
}

/**
 *
 * @constructor
 */
function pHMeter() {
    var PH_ADDR = 0x63,
//        PH_CMD_INFO = 0x49,
        READ_DELAY = 1000,
        READ_LENGTH = 32,
        PH_CMD_READ = 0x52,
        PH_QUERY_CALIBRATION = new Buffer('cal,?');


    pHMeter.prototype.start = function () {
        var deferred = q.defer();

        this.state = {pHValue: 6.0, calibrationHigh: 7.0, calibrationMiddle: 6.0, calibrationLow: 5.0};

        if (this.isSimulated()) {
            this.interval = setInterval(function () {
                this.state.pHValue = 5 + 0.1 * new Date().getTime() % 2;

                this.publishStateChange();
            }.bind(this), 20000);

            deferred.resolve();
        } else {
            if (!this.i2c) {
                this.i2c = require('i2c-bus');
            }

            var i2c1 = this.i2c.openSync(1);

            /*
             //checkCalibration
             //i2c1.sendByteSync(PH_ADDR, PH_CMD_READ);
             i2c1.i2cWriteSync(PH_ADDR, 5, PH_QUERY_CALIBRATION);
             setTimeout(function () {
             var PH_OUTPUT = new Buffer(READ_LENGTH);
             i2c1.i2cReadSync(PH_ADDR, READ_LENGTH, PH_OUTPUT);
             //                console.log(String.fromCharCode.apply(String, PH_OUTPUT))
             console.log(PH_OUTPUT.toString("ascii"));


             //this.state.pHValue = String.fromCharCode.apply(String, PH_OUTPUT);
             //this.publishStateChange();

             //console.log(this.state.pHValue);
             }.bind(this), 1700);
             */

            // Read PH Value

            this.interval = setInterval(function () {
                i2c1.sendByteSync(PH_ADDR, PH_CMD_READ);

                setTimeout(function () {
                    var PH_OUTPUT = new Buffer(READ_LENGTH);
                    i2c1.i2cReadSync(PH_ADDR, READ_LENGTH, PH_OUTPUT);

                    this.state.pHValue = PH_OUTPUT.toString("ascii");
                    this.publishStateChange();

                    console.log(this.state.pHValue);
                }.bind(this), READ_DELAY);
            }.bind(this), 20000);

            deferred.resolve();
        }

        return deferred.promise;
    };

    /**
     *
     */
    pHMeter.prototype.stop = function () {
        var deferred = q.defer();

        if (this.isSimulated()) {
            if (this.interval) {
                clearInterval(this.interval);
            }
        } else {
        }

        deferred.resolve();

        return deferred.promise;
    };

    /**
     *
     */
    pHMeter.prototype.getState = function () {
        return this.state;
    };

    /**
     *
     */
    pHMeter.prototype.setState = function () {
    };

    /**
     *
     */
    pHMeter.prototype.calibrateHigh = function (parameters) {
        if (this.isSimulated()) {
            this.state.calibrationHigh = parameters.value;
        } else {
            // TODO
        }
    };


    /**
     *
     */
    pHMeter.prototype.calibrateMiddle = function (parameters) {
        if (this.isSimulated()) {
            this.state.calibrationMiddle = parameters.value;
        } else {
            // TODO
        }
    };


    /**
     *
     */
    pHMeter.prototype.calibrateLow = function (parameters) {
        if (this.isSimulated()) {
            this.state.calibrationLow = parameters.value;
        } else {
            // TODO
        }
    };


    /**
     *
     */
    pHMeter.prototype.setI2CAddress = function (parameters) {
        if (this.isSimulated()) {
        } else {
            // TODO
        }
    };
}

