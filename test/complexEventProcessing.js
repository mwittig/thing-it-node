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
        type: {state: [{id: "testValue"}]},
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
var eventProcessor;

describe('[thing-it] Complex Event Processing', function () {
    describe('Start and Stop Event Processor', function () {
        before(function () {
            eventProcessor = EventProcessor.bind(testNode, {
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
            });
        });
        it('should complete without error', function () {
            eventProcessor.start();
            eventProcessor.stop();

            return true;
        });
    });
    describe('Event Detection', function () {
        before(function () {
            eventProcessor = EventProcessor.bind(testNode, eventProcessor);
        });
        it('should result in Node Service action invocation', function (done) {
            testNode.testCallback = function () {
                eventProcessor.stop();
                done();
            };

            eventProcessor.start();
            this.timeout(15000);

            setTimeout(function () {
                eventProcessor.pushDeviceState(testNode.testDevice1, {testValue: 800});

                setTimeout(function () {
                    eventProcessor.pushDeviceState(testNode.testDevice1, {testValue: 810});
                }, 1000);
            }, 2000);
        });
        after(function () {
            eventProcessor.stop();
        });
    });
    describe('Event Detection End of Interval', function () {
        before(function () {
            eventProcessor = EventProcessor.bind(testNode, {
                id: "eventProcessor1",
                label: "Event Processor 1",
                observables: ["testDevice1"],
                trigger: {
                    type: "timeInterval",
                    content: {
                        interval: 10000,
                        conditions: [{
                            cumulation: "average",
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
            });
        });
        it('should result in Node Service action invocation', function (done) {
            testNode.testCallback = function () {
                eventProcessor.stop();
                done();
            };

            eventProcessor.start();

            this.timeout(15000);

            setTimeout(function () {
                eventProcessor.pushDeviceState(testNode.testDevice1, {testValue: 800});
                setTimeout(function () {
                    eventProcessor.pushDeviceState(testNode.testDevice1, {testValue: 800});

                    setTimeout(function () {
                        eventProcessor.pushDeviceState(testNode.testDevice1, {testValue: 810});
                    }, 1000);
                }, 1000);
            }, 1000);
        });
        after(function () {
            eventProcessor.stop();
        });
    });
    describe('Subsequent single events', function () {
        before(function () {
            eventProcessor = EventProcessor.bind(testNode, {
                id: "eventProcessor1",
                label: "Event Processor 1",
                observables: ["testDevice1", "testDevice2"],
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
                        }, {
                            cumulation: "minimum",
                            observable: "testDevice2",
                            stateVariable: "testValue",
                            compareOperator: "<",
                            compareValue: 400
                        }]
                    }
                },
                action: {
                    type: "nodeService", "content": {"service": "testService"}
                }
            });
        });
        it('should result in Node Service action invocation', function (done) {
            testNode.testCallback = function () {
                done();
            };

            eventProcessor.start();

            this.timeout(15000);

            setTimeout(function () {
                eventProcessor.pushDeviceState(testNode.testDevice1, {testValue: 820});

                setTimeout(function () {
                    eventProcessor.pushDeviceState(testNode.testDevice2, {testValue: 200});
                }, 4000);
            }, 1000);
        });
        after(function () {
            eventProcessor.stop();
        });
    });
    describe('Dependent events', function () {
        before(function () {
            eventProcessor = EventProcessor.bind(testNode, {
                id: "eventProcessor1",
                label: "Event Processor 1",
                observables: ["testDevice1", "testDevice2"],
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
                        }, {
                            cumulation: "minimum",
                            observable: "testDevice2",
                            stateVariable: "testValue",
                            compareOperator: "<",
                            compareValue: 400,
                            referencedCondition: 0,
                            delayInterval: 3000,
                            delayVarianceInterval: 2000
                        }]
                    }
                },
                action: {
                    type: "nodeService", "content": {"service": "testService"}
                }
            });
        });
        it('should result in Node Service action invocation', function (done) {
            testNode.testCallback = function () {
                done();
            };

            eventProcessor.start();

            this.timeout(15000);

            setTimeout(function () {
                eventProcessor.pushDeviceState(testNode.testDevice1, {testValue: 820});

                setTimeout(function () {
                    eventProcessor.pushDeviceState(testNode.testDevice2, {testValue: 200});

                }, 4000);
            }, 1000);
        });
        after(function () {
            eventProcessor.stop();
        });
    });
    describe('Dependent, excluded events', function () {
        before(function () {
            eventProcessor = EventProcessor.bind(testNode, {
                id: "eventProcessor1",
                label: "Event Processor 1",
                observables: ["testDevice1", "testDevice2"],
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
                        }, {
                            cumulation: "minimum",
                            observable: "testDevice2",
                            stateVariable: "testValue",
                            compareOperator: "<",
                            compareValue: 400,
                            referencedCondition: 0,
                            delayInterval: 3000,
                            delayVarianceInterval: 2000,
                            exclude: true
                        }]
                    }
                },
                action: {
                    type: "nodeService", "content": {"service": "testService"}
                }
            });
        });
        it('should result in Node Service action invocation', function (done) {
            testNode.testCallback = function () {
                done();
            };

            eventProcessor.start();

            this.timeout(15000);

            setTimeout(function () {
                eventProcessor.pushDeviceState(testNode.testDevice1, {testValue: 820});

                setTimeout(function () {
                    eventProcessor.pushDeviceState(testNode.testDevice2, {testValue: 500});
                }, 4000);
            }, 1000);
        });
        after(function () {
            eventProcessor.stop();
        });
    });
    describe('Dependent, excluded events, negative test', function () {
        before(function () {
            eventProcessor = EventProcessor.bind(testNode, {
                id: "eventProcessor1",
                label: "Event Processor 1",
                observables: ["testDevice1", "testDevice2"],
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
                        }, {
                            cumulation: "minimum",
                            observable: "testDevice2",
                            stateVariable: "testValue",
                            compareOperator: "<",
                            compareValue: 400,
                            referencedCondition: 0,
                            delayInterval: 3000,
                            delayVarianceInterval: 2000,
                            exclude: true
                        }]
                    }
                },
                action: {
                    type: "nodeService", "content": {"service": "testService"}
                }
            });
        });
        it('should result in Node Service action invocation', function (done) {
            testNode.testCallback = function () {
                // Callback must not be fired

                done(false);
            };

            eventProcessor.start();

            // If after 15 seconds no action is fired, OK

            this.timeout(17000);

            setTimeout(function () {
                done();
            }, 15000);

            setTimeout(function () {
                eventProcessor.pushDeviceState(testNode.testDevice1, {testValue: 820});

                setTimeout(function () {
                    eventProcessor.pushDeviceState(testNode.testDevice2, {testValue: 200});
                }, 4000);
            }, 1000);
        });
        after(function () {
            eventProcessor.stop();
        });
    });
    describe('Legacy Processing', function () {
        before(function () {
            eventProcessor = EventProcessor.bind(testNode, {
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
            });
        });
        it('should produce Device Discovery message', function (done) {
            testNode.testCallback = function () {
                done();
            };

            eventProcessor.start();

            this.timeout(15000);

            setTimeout(function () {
                eventProcessor.pushDeviceState(testNode.testDevice1, {testValue: 800});

                setTimeout(function () {
                    eventProcessor.pushDeviceState(testNode.testDevice1, {testValue: 810});
                }, 1000);
            }, 2000);
        });
        after(function () {
            eventProcessor.stop();
        });
    });
});





