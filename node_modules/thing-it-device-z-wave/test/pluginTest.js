var assert = require("assert");

describe('[thing-it] Z-Wave', function () {
    var testDriver;

    before(function () {
        testDriver = require("thing-it-test").createTestDriver({logLevel: "error"});

        testDriver.registerDevicePlugin(__dirname + "/../zWaveNetwork");
        testDriver.registerUnitPlugin(__dirname + "/../default-units/multilevelSensor");
        testDriver.registerUnitPlugin(__dirname + "/../default-units/binaryPowerSwitch");
    });
    describe('Start Configuration', function () {
        it('should complete without error', function () {
            return testDriver.start({
                configuration: require("../examples/configuration.js"),
                heartbeat: 10
            });
        });
    });
    describe('Switch Discovery', function () {
        this.timeout(40000);

        before(function () {
            testDriver.removeAllListeners();
        });
        it('should produce Device Discovery message', function (done) {
            testDriver.addListener({
                publishDeviceRegistration: function (device) {
                    console.log("Here we go! >>>>>>>");
                    done();
                }
            });
        });
    });
    describe('Binary Power Switch Methods', function () {
        this.timeout(20000);

        before(function () {
            testDriver.removeAllListeners();
        });
        it('should produce Device Discovery message', function (done) {
            setTimeout(function () {
                testDriver.zWaveNetwork.binaryPowerSwitch1.on();

                setTimeout(function () {
                    testDriver.zWaveNetwork.binaryPowerSwitch1.off();
                    setTimeout(function () {
                        testDriver.zWaveNetwork.binaryPowerSwitch1.on();
                    }.bind(this), 3000);
                }.bind(this), 3000);
            }.bind(this), 3000);

            testDriver.addListener({
                publishDeviceRegistration: function (device) {
                    done();
                }
            });
        });
    });
});





