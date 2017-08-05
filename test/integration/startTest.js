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

describe('[thing-it] Device Test', function () {
    before(function () {
        node.bootstrap(options, app, io);
    });
    describe('Basic Test', function () {
        this.timeout(10000);

        it('should complete without error', function (done) {
            setTimeout(function () {
                console.log('Module', testDeviceModule);
                console.log('Device', testDeviceModule.getDevice('ti__4711__testDevice1').label);
                console.log('Actor', testDeviceModule.getActor('ti__4711__testDevice1', 'testActor1').label);
                console.log('Sensor', testDeviceModule.getSensor('ti__4711__testDevice1', 'testSensor1').label);

                done();
            }.bind(this), 5000);
        });
        it('should trigger Device State Change Notification', function (done) {
            testDeviceModule.getActor('ti__4711__testDevice1', 'testActor1').off();
            testDeviceModule.getSensor('ti__4711__testDevice1', 'testSensor1').publishEvent('click', {});

            setTimeout(function () {
                console.log('Actor', testDeviceModule.getActor('ti__4711__testDevice1', 'testActor1').getState());

                done();
            }.bind(this), 2000);
        });
        it('should trigger Device State Change Notification', function (done) {
            testDeviceModule.getActor('ti__4711__testDevice1', 'testActor1').off();
            testDeviceModule.getSensor('ti__4711__testDevice1', 'testActor2').toggle();

            setTimeout(function () {
                console.log('Actor', testDeviceModule.getActor('ti__4711__testDevice1', 'testActor1').getState());

                done();
            }.bind(this), 2000);
        });
    });
});





