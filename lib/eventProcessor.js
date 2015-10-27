module.exports = {
    bind: function (node, eventProcessor) {
        utils.inheritMethods(eventProcessor, new EventProcessor());

        eventProcessor.node = node;
        eventProcessor.logLevel = node.logLevel;
        eventProcessor.scope = new Scope();

        eventProcessor.logDebug("Scope created");

        // TODO may pass eventProcessor as execution scope and not use as variable - still ... needs to be unique

        node[eventProcessor.id] = eventProcessor.scope;

        // Trigger preprocessing

        if (eventProcessor.trigger.type == "timeInterval") {
            eventProcessor.match = eventProcessor.trigger.content.cumulation + "(" + eventProcessor.observables[0] +
                "." + eventProcessor.trigger.content.stateVariable + ") " +
                eventProcessor.trigger.content.compareOperator + " " + eventProcessor.trigger.content.compareValue;
        } else if (eventProcessor.trigger.type == "event") {

        } else if (eventProcessor.trigger.type == "singleStateChange") {

        }

        eventProcessor.logDebug("Trigger preprocessed: " + eventProcessor.match);

        action.bind(node, eventProcessor.action);

        eventProcessor.logDebug("Action bound.");

        return eventProcessor;
    }
};

var q = require('q');
var utils = require("./utils");
var logger = require("./logger");
var action = require("./action");

/**
 *
 */
function EventProcessor() {
    this.class = "EventProcessor";

    utils.inheritMethods(this, logger.create());

    /**
     * Required for logging.
     */
    EventProcessor.prototype.publishMessage = function (content) {
        this.node.publishMessage(content);
    };

    /**
     *
     */
    EventProcessor.prototype.clientCopy = function () {
        var copy = {
            id: this.id,
            label: this.label,
            observables: [],
            trigger: this.trigger, // TODO May deep copy
            action: this.action.clientCopy()
        };

        for (var n in this.observables) {
            copy.observables.push(this.observables[n]);
        }

        return copy;
    };

    /**
     *
     */
    EventProcessor.prototype.register = function () {
        // For logging

        this.class = "EventProcessor";

        try {
            var body = "with (scope){this.logDebug('Match expression result is ' + (" + this.match + ")); return ("
                + this.match + ");}";

            this.logDebug("Match function: " + body);

            this.matchFunction = new Function("scope",
                body);
        }
        catch (error) {
            this.logError("Failed to create match function: " + error);

            throw "Failed to create match function."
        }

        for (var n = 0; n < this.observables.length; ++n) {
            if (this.observables[n].indexOf(".") < 0) {
                // Device to be observed

                this.scope[this.observables[n]] = {
                    event: null,
                    series: []
                };

                for (var m in this.node[this.observables[n]].type.state) {
                    this.scope[this.observables[n]][this.node[this.observables[n]].type.state[m].id] = {series: []};
                }

                this.node[this.observables[n]].eventProcessors.push(this);
            }
            else {
                var path = this.observables[n].split(".");

                if (!this.scope[path[0]]) {
                    this.scope[path[0]] = {};
                }

                this.scope[path[0]][path[1]] = {
                    event: null,
                    series: []
                };

                this.node[path[0]][path[1]].eventProcessors.push(this);
            }
        }

        this.logDebug("Registered with Observables.");
    };

    /**
     * Records Sensor data for evaluation at the end of the window
     */
    EventProcessor.prototype.push = function (sensor, value) {
        this.logDebug("Add data " + value + " for " + sensor.id);

        if (this.trigger.type === "timeInterval") {
            this.scope[sensor.device.id][sensor.id].series.push({
                value: value,
                timestamp: new Date().getTime()
            });
        }
    };

    /**
     * Notifies the Event Processor of an Event on a Sensor.
     */
    EventProcessor.prototype.notifyOnDeviceEvent = function (device, event) {
        this.logDebug("Receiving event", event);

        // TODO What is this for

        for (var n = 0; n < this.observables.length; ++n) {
            if (this.observables[n].indexOf(".") < 0) {
                this.scope[this.observables[n]].event = null;
            }
            else {
                var path = this.observables[n].split(".");

                this.scope[path[0]][path[1]].event = null;
            }
        }

        this.scope[device.id].event = event;

        // TODO Evaluate event only if "event" property was set, otherwise
        // collect events

        try {
            if (this.matchFunction(this.scope)) {
                this.logDebug("Condition matched.");
                this.action.execute();
            }
        } catch (error) {
            this.logError("Error executing match function for Event Processor [" + this.label + "]: " + error);
        }
    };

    /**
     *
     * @param device
     * @param state
     */
    EventProcessor.prototype.pushDeviceState = function (device, state) {
        if (this.trigger.type === "timeInterval") {
            this.logDebug("Adding Device state change to window: " + JSON.stringify(state));

            for (var n in state) {
                // Guard for incomplete state definitions

                if (!this.scope[device.id][n]) {
                    continue;
                }

                this.scope[device.id][n].series.push({
                    value: state[n],
                    timestamp: new Date().getTime()
                });
            }
        } else {
            this.logDebug("Processing Device state change: " + JSON.stringify(state));

            this.scope[device.id].event = {
                type: "stateChange",
                state: state
            };

            try {
                if (this.matchFunction(this.scope)) {
                    this.logDebug("Condition matched.");
                    this.action.execute();
                }
            } catch (error) {
                this.logError("Error executing match function for Event Processor [" + this.label + "]: " + error);
            }
        }
    };

    /**
     * Notifies the Event Processor of an Event on a Sensor.
     */
    EventProcessor.prototype.notify = function (sensor, event) {
        this.logDebug("Receiving Sensor event: ", event);

        for (var n = 0; n < this.observables.length; ++n) {
            if (this.observables[n].indexOf(".") < 0) {
                this.scope[this.observables[n]].event = null;
            }
            else {
                var path = this.observables[n].split(".");

                this.scope[path[0]][path[1]].event = null;
            }
        }

        this.scope[sensor.device.id][sensor.id].event = event;

        // TODO Evaluate event only if "event" property was set, otherwise
        // collect events

        try {
            if (this.matchFunction(this.scope)) {
                this.action.execute();
            }
        } catch (error) {
            this.logError("Error executing match function for Event Processor [" + this.label + "]: " + error);
        }
    };

    /**
     * Start listening.
     */
    EventProcessor.prototype.start = function () {
        this.register();

        this.logDebug("Event Processor registered.");

        if (this.trigger.type === "timeInterval") {
            setInterval(function () {
                this.logInfo("Complete Interval");

                for (var n = 0; n < this.observables.length; ++n) {
                    if (this.observables[n].indexOf(".") < 0) {
                        this.logInfo(JSON.stringify(this.scope[this.observables[n]]));
                    }
                    else {
                        var path = this.observables[n].split(".");

                        this.logDebug(JSON.stringify(this.scope[path[0]][path[1]]));
                    }
                }

                // TODO Block events to be logged hereafter

                try {
                    if (this.matchFunction(this.scope)) {
                        this.logInfo("Condition matched.");
                        this.action.execute();
                    }
                } catch (error) {
                    // Null pointer exception or the like

                    this.logError("Exception in match function: " + error);
                }

                // Reinitialize series

                for (var n = 0; n < this.observables.length; ++n) {
                    if (this.observables[n].indexOf(".") < 0) {
                        this.logDebug(this.observables[n]);
                        for (var m in this.node[this.observables[n]].type.state) {
                            this.scope[this.observables[n]][this.node[this.observables[n]].type.state[m].id] = {series: []};
                        }
                    }
                    else {
                        var path = this.observables[n].split(".");

                        this.scope[path[0]][path[1]] = {
                            series: []
                        };
                    }

                    this.logInfo("Reinitializing series for [" + this.observables[n] + "].")
                }
            }.bind(this), this.trigger.content.interval)
        }

        this.logInfo("Event Processor [" + this.label + "] listening.");
    };
}

/**
 *
 */
function Scope() {
    /**
     *
     */
    Scope.prototype.minimum = function (data) {
        var minimum = 10000000000; // TODO

        for (var n = 0; n < data.length; ++n) {
            minimum = Math.min(minimum, data[n].value);
        }

        return minimum;
    };

    /**
     *
     */
    Scope.prototype.maximum = function (data) {
        var maximum = -10000000000; // TODO

        for (var n = 0; n < data.length; ++n) {
            maximum = Math.max(maximum, data[n].value);
        }

        return maximum;
    };

    /**
     *
     */
    Scope.prototype.average = function (data) {
        var sum = 0;

        for (var n = 0; n < data.length; ++n) {
            sum += data[n].value;
        }

        // this.logInfo("average() = " + sum / data.length);

        return sum / data.length;
    };

    /**
     *
     */
    Scope.prototype.deviation = function (data) {
        var average = this.average(data);

        var sum = 10000000000; // TODO

        for (var n = 0; n < data.length; ++n) {
            sum = (data[n].value - average) * (data[n].value - average);
        }

        // this.logInfo("deviation() = " + Math.sqrt(sum));

        return Math.sqrt(sum);
    };
}
