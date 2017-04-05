var assert = require("assert");

describe('[thing-it] BACnet Device', function () {
    var testDriver;

    before(function () {
        testDriver = require("thing-it-test").createTestDriver({logLevel: "error"});

        testDriver.registerDevicePlugin(__dirname + "/../bacNetDevice");
        testDriver.registerUnitPlugin(__dirname + "/../default-units/binaryInput");
        testDriver.registerUnitPlugin(__dirname + "/../default-units/binaryValue");
        testDriver.registerUnitPlugin(__dirname + "/../default-units/analogInput");
        testDriver.registerUnitPlugin(__dirname + "/../default-units/analogValue");

    });
    describe('Start Configuration', function () {
        this.timeout(10000);

        it('should complete without error', function (done) {
            setTimeout(function () {
                done();
            }.bind(this), 5000);

            testDriver.start({
                configuration: require("../examples/configuration.js"),
                heartbeat: 10
            });
        });
    });

    describe('Binary Input Test Update', function () {
        this.timeout(20000);

        before(function () {
            testDriver.removeAllListeners();
        });
        it('should execute the update service successfully', function (done) {
            testDriver.bacnet1.binaryInput1.update()
                .then(function() {
                    done();
                });
        });
    });

    describe('Binary Value Test ON', function () {
        this.timeout(20000);

        before(function () {
            testDriver.removeAllListeners();
            testDriver.bacnet1.binaryValue1.state.presentValue = false;
        });
        it('should produce Actor State Change message', function (done) {

            testDriver.addListener({
                publishActorStateChange: function (device, actor, state) {
                    if (actor.id === "binaryValue1" && device.id === "bacnet1" && state.presentValue === true) {
                        done();
                    }

                }
            });

            testDriver.bacnet1.binaryValue1.on();
        });
    });

    describe('Binary Value Test OFF', function () {
        this.timeout(20000);

        before(function () {
            testDriver.removeAllListeners();
            testDriver.bacnet1.binaryValue1.state.presentValue = true;
        });
        it('should produce Actor State Change message', function (done) {

            testDriver.addListener({
                publishActorStateChange: function (device, actor, state) {
                    if (actor.id === "binaryValue1" && device.id === "bacnet1" && state.presentValue === false) {
                        done();
                    }

                }
            });

            testDriver.bacnet1.binaryValue1.off();
        });
    });

    describe('Binary Value Test Toggle OFF/ON', function () {
        this.timeout(20000);

        before(function () {
            testDriver.removeAllListeners();
            testDriver.bacnet1.binaryValue1.state.presentValue = false;
        });
        it('should toggle from off to on and produce Actor State Change message', function (done) {

            testDriver.addListener({
                publishActorStateChange: function (device, actor, state) {
                    if (actor.id === "binaryValue1" && device.id === "bacnet1" && state.presentValue === true) {
                        done();
                    }

                }
            });

            testDriver.bacnet1.binaryValue1.toggle();
        });
    });

    describe('Binary Value Test Toggle ON/OFF', function () {
        this.timeout(20000);

        before(function () {
            testDriver.removeAllListeners();
            testDriver.bacnet1.binaryValue1.state.presentValue = true;
        });

        it('should toggle from on to off and produce Actor State Change message', function (done) {

            testDriver.addListener({
                publishActorStateChange: function (device, actor, state) {
                    if (actor.id === "binaryValue1" && device.id === "bacnet1" && state.presentValue === false) {
                        done();
                    }

                }
            });

            testDriver.bacnet1.binaryValue1.toggle();
        });
    });

    describe('Analog Input Test Update', function () {
        this.timeout(20000);

        before(function () {
            testDriver.removeAllListeners();
        });
        it('should execute the update service successfully', function (done) {
            testDriver.bacnet1.analogInput1.update()
                .then(function() {
                    done();
                });
        });
    });

    //for this test to succeed it is necessary to set the presentValue of this AnalogInput from another source
    describe('Analog Input Test waiting Notifications', function () {
        this.timeout(20000);

        before(function () {
            testDriver.removeAllListeners();
        });
        it('should set the present value and produce Actor State Change message', function (done) {

            testDriver.addListener({
                publishActorStateChange: function (device, actor, state) {
                    if (actor.id === "analogInput1" && device.id === "bacnet1") {
                        done();
                    }

                }
            });
        });
    });

    describe('Analog Value Test Update', function () {
        this.timeout(20000);

        before(function () {
            testDriver.removeAllListeners();
        });
        it('should execute the update service successfully', function (done) {
            testDriver.bacnet1.analogValue1.update()
                .then(function() {
                    done();
                });
        });
    });


    describe('Analog Value Test setPresentValue and Notification', function () {
        this.timeout(20000);

        before(function () {
            testDriver.removeAllListeners();
        });
        it('should set the present value and produce Actor State Change message', function (done) {

            testDriver.addListener({
                publishActorStateChange: function (device, actor, state) {
                    if (actor.id === "analogValue1" && device.id === "bacnet1") {
                        done();
                    }

                }
            });

            testDriver.bacnet1.analogValue1.setPresentValue(Math.random() * 25);
        });
    });


    describe('Stop Configuration', function () {
        this.timeout(10000);

        it('should complete without error', function (done) {
            setTimeout(function () {
                done();
            }.bind(this), 5000);

            testDriver.stop();
        });
    });
});