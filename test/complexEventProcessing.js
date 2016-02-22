var assert = require("assert");
var EventProcessor = require("../lib/eventProcessor");

// Test Driver Node

function TestNode() {
    this.publishMessage = function (content) {
        console.log("Message published: " + content);
    },
        this.logLevel = "debug";
    this.testDevice1 = {
        type: {state: [{id: "testValue"}]},
        id: "testDevice1",
        state: {testValue: 17},
        eventProcessors: []
    };
    this.testDevice2 = {
        type: {state: {id: "testValue"}},
        id: "testDevice2",
        state: {testValue: 17},
        eventProcessors: []
    };
    this.testService = function () {
        console.log("Test Service called.");

        if (this.testCallback) {
            this.testCallback();
        }
    }
};

var testNode = new TestNode();
var eventProcessor = {
    id: "eventProcessor1",
    label: "Event Processor 1",
    observables: ["testDevice1"],
    trigger: {
        type: "timeInterval",
        content: {
            interval: 10000,
            conditions: [{
                cumulation: "maximum",
                observable: "testDevice1",
                stateVariable: "testValue",
                compareOperator: ">",
                compareValue: 800
            }]
        }
    },
    action: {
        type: "nodeService", "content": {"service": "testService"}
    }
};

var legacyEventProcessor = {
    id: "eventProcessor1",
    label: "Event Processor 1",
    observables: ["testDevice1"],
    trigger: {
        type: "timeInterval",
        content: {
            interval: 10000,
            cumulation: "maximum",
            stateVariable: "testValue",
            compareOperator: ">",
            compareValue: 800
        }
    },
    action: {
        type: "nodeService", "content": {"service": "testService"}
    }
};

describe('[thing-it] Complex Event Processing', function () {
    before(function () {
        eventProcessor = EventProcessor.bind(testNode, eventProcessor);
    });
    describe('Start and Stop Event Processor', function () {
        it('should complete without error', function () {
            eventProcessor.start();
            eventProcessor.stop();

            return true;
        });
    });
    describe('Event Detection', function () {
        this.timeout(15000);

        before(function () {
            eventProcessor = EventProcessor.bind(testNode, eventProcessor);
        });
        it('should produce Device Discovery message', function (done) {
            eventProcessor.start();

            setTimeout(function () {
                eventProcessor.pushDeviceState(testNode.testDevice1, {testValue: 800});

                setTimeout(function () {
                    eventProcessor.pushDeviceState(testNode.testDevice1, {testValue: 810});

                    testNode.testCallback = function () {
                        done();
                    };

                    setTimeout(function () {
                        // Wait for interval to finish
                    }, 10000);
                }, 1000);
            }, 2000);
        });
    });
    describe('Legacy Processing', function () {
        this.timeout(15000);

        before(function () {
            eventProcessor = EventProcessor.bind(testNode, legacyEventProcessor);
        });
        it('should produce Device Discovery message', function (done) {
            eventProcessor.start();

            setTimeout(function () {
                eventProcessor.pushDeviceState(testNode.testDevice1, {testValue: 800});

                setTimeout(function () {
                    eventProcessor.pushDeviceState(testNode.testDevice1, {testValue: 810});

                    testNode.testCallback = function () {
                        done();
                    };

                    setTimeout(function () {
                        // Wait for interval to finish
                    }, 10000);
                }, 1000);
            }, 2000);
        });
    });
});





