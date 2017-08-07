var app = require('express')();
var io = new require('socket.io')({
    transports: ['websocket']
});
var node = require("../../lib/node");
var options = {
    port: 3001,
    protocol: 'http',
    nodeConfigurationsDirectory: __dirname + '/../../examples/event-processor/',
    dataDirectory: './tmp',
    usersDirectory: './tmp',
    simulated: true,
    authentication: 'none',
    logLevel: 'debug'
};
var testDeviceModule = require('thing-it-device-test');

testDeviceModule.setPrefix('ti__4711__');

describe('[thing-it] Device Test', function () {
    before(function () {
        node.bootstrap(options, app, io);
    });
    describe('Basic Test', function () {
        this.timeout(10000);

        it('should complete without error', function (done) {
            console.log('Device', testDeviceModule.getDevice('testDevice1').label);
            console.log('Actor', testDeviceModule.getActor('testDevice1', 'testActor1').label);
            console.log('Actor', testDeviceModule.getActor('testDevice1', 'testActor2').label);
            console.log('Sensor', testDeviceModule.getSensor('testDevice1', 'testSensor1').label);

            setTimeout(function () {

                done();
            }.bind(this), 5000);
        });
        it('should trigger Sensor Event Notification', function (done) {
            testDeviceModule.getActor('testDevice1', 'testActor1').off();
            testDeviceModule.getSensor('testDevice1', 'testSensor1').publishEvent('click', {});

            setTimeout(function () {
                console.log('Actor', testDeviceModule.getActor('testDevice1', 'testActor1').getState());

                done();
            }.bind(this), 2000);
        });
        it('should trigger Actor State Change Notification', function (done) {
            testDeviceModule.getActor('testDevice1', 'testActor1').off();
            testDeviceModule.getActor('testDevice1', 'testActor2').toggle();

            setTimeout(function () {
                console.log('Actor', testDeviceModule.getActor('testDevice1', 'testActor1').getState());

                done();
            }.bind(this), 2000);
        });
        it('should trigger Sensor Value Change Notification', function (done) {
            testDeviceModule.getActor('testDevice1', 'testActor1').off();
            testDeviceModule.getSensor('testDevice1', 'testSensor1').publishValueChangeEvent({booleanField1: true});

            setTimeout(function () {
                console.log('Actor', testDeviceModule.getActor('testDevice1', 'testActor1').getState());

                done();
            }.bind(this), 2000);
        });
    });
});





