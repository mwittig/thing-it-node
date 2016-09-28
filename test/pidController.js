var assert = require("assert");
var EventProcessor = require("../lib/eventProcessor");
var utils = require("../lib/utils");

// Test Driver Node

function TestNode() {
    this.publishMessage = function (content) {
    };
    this.logLevel = "info";
    this.testDevice = {
        type: {state: [{id: "input"}, {id: "output"}]},
        id: "testDevice",
        state: {input: 0, output: 110},
        lastOutput: 0,
        eventProcessors: [],
        setState: function (state) {
            if (state.input) {
                if (this.timeout) {
                    return;
                }

                this.timeout = setTimeout(function () {
                    if (this.lastOutput == undefined) {
                        this.lastOutput = state.input;
                    }

                    this.state.output = state.input - 0.1 * this.lastOutput;

                    var delta = Math.abs((this.lastOutput - this.state.output) / this.state.output);

                    this.lastOutput = this.state.output

                    console.log('>>>', this.state.output);

                    this.timeout = null;

                    if (delta > 0.001) {
                        for (var n = 0; n < this.eventProcessors.length; ++n) {
                            this.eventProcessors[n].pushDeviceState(this, this.state);
                        }
                    }
                }.bind(this), 100);
            }
        }
    };
    this.data = [{
        id: "testData",
        state: {value: 25},
        eventProcessors: []
    }];

    /**
     *
     */
    this.findData = function (id) {
        for (var n in this.data) {
            if (this.data[n].id == id) {
                return this.data[n];
            }
        }

        throw "No Data with ID [" + id + "].";
    };
}

var testNode;
var eventProcessor;

describe('[thing-it] Complex Event Processing', function () {
    describe('PID Processing Detection', function () {
        before(function () {
            testNode = new TestNode();
            eventProcessor = EventProcessor.bind(testNode, {
                id: "eventProcessor1",
                label: "Event Processor 1",
                observables: ["testDevice"],
                trigger: {
                    type: "singleStateChange",
                    content: {field: 'output'}
                },
                action: {
                    type: "pidController",
                    content: {
                        setPointVariable: {type: 'dataField', data: 'testData', field: 'value'},
                        proportionalParameter: 0.1,
                        integralParameter: 0,
                        differentialParameter: 0.01,
                        controlVariable: {type: 'device', device: 'testDevice', field: 'input'}
                    }
                }
            });
        });
        it('should result in Node Service action invocation', function (done) {
            eventProcessor.start();
            this.timeout(600000);

            // Adjust setpoint

            eventProcessor.pushDataStateChange(testNode.data[0], {value: 10});
            setTimeout(function () {
                eventProcessor.pushDataStateChange(testNode.data[0], {value: 15});
            }, 20000);
        });
        after(function () {
            eventProcessor.stop();
        });
    });
});





