module.exports = {
    bind: function (node, eventProcessor) {
        utils.inheritMethods(eventProcessor, new EventProcessor());

        return eventProcessor.bind(node);
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
    EventProcessor.prototype.bind = function (node) {
        this.node = node;
        this.logLevel = node.logLevel;
        this.scope = new Scope();

        this.logDebug("Scope created");

        // TODO may pass this as execution scope and not use as variable - still ... needs to be unique

        node[this.id] = this.scope;

        // Legacy

        if (this.trigger.content && this.trigger.content.cumulation && this.trigger.content.stateVariable) {
            if (!this.trigger.content.conditions) {
                this.trigger.content.conditions = [];
            }

            this.trigger.content.conditions.push({
                cumulation: this.trigger.content.cumulation,
                observable: this.observables[0],
                stateVariable: this.trigger.content.stateVariable,
                compareOperator: this.trigger.content.compareOperator,
                compareValue: this.trigger.content.compareValue
            });
        }

        // Trigger preprocessing

        if (this.trigger.type === "timeInterval") {
            for (var n in this.trigger.content.conditions) {
                try {
                    var match = "this." + this.trigger.content.conditions[n].cumulation + "(this." + this.trigger.content.conditions[n].observable +
                        "." + this.trigger.content.conditions[n].stateVariable + ".series) " +
                        this.trigger.content.conditions[n].compareOperator + " " + this.trigger.content.conditions[n].compareValue;
                    var body = "this.logDebug('Match expression result is ' + (" + match + ")); return ("
                        + match + ");";

                    this.logDebug("Match function: " + body);

                    this.trigger.content.conditions[n].matchFunction = new Function("scope",
                        body).bind(this.scope);
                }
                catch (error) {
                    this.logError("Failed to create match function: " + error);

                    throw "Failed to create match function."
                }
            }
        } else if (this.trigger.type == "event") {
            // Nothing to do
        } else if (this.trigger.type == "singleStateChange") {
            // Nothing to do
        }

        action.bind(node, this.action);

        this.logDebug("Action bound.");

        return this;
    };

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

        for (var n in this.observables) {
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

        if (this.action.type == 'pidController' && this.action.content.setPointVariable.type == 'dataField') {
            this.node.findData(this.action.content.setPointVariable.data).eventProcessors.push(this);
        }

        this.logDebug("Registered with Observables.");
    };


    /**
     *
     */
    EventProcessor.prototype.getObservable = function (observable) {
        var path = observable.split('.');

        if (path.length == 1) {
            return this.node[path[0]];
        } else {
            return this.node[path[0]][path[1]];
        }
    };

    /**
     *
     * @param device
     * @param state
     */
    EventProcessor.prototype.notifyOnDeviceStateChange = function (device, state) {
        if (this.trigger.type == "event") {
            return;
        }
        else if (this.trigger.type == "singleStateChange" && state && state[this.trigger.content.field]) {
            this.scope = {};
            this.scope[device.id] = {};
            this.scope[device.id].event = {
                type: "stateChange",
                state: state
            };

            this.action.execute(this.scope);
        }
        else if (this.trigger.type === "timeInterval") {
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

            this.evaluate();
        }
    };

    EventProcessor.prototype.notifyOnDeviceOperationalStateChange = function (device, state) {
        this.logDebug("Receiving Device Operational State Change", device, state);

        // TODO To be supported
    };

    /**
     * Notifies the Event Processor of an Event on a Sensor.
     */
    EventProcessor.prototype.notifyOnDeviceEvent = function (device, event) {
        this.logDebug("Receiving Device Event", event);

        if (this.trigger.type == "singleStateChange") {
            // Events irrelevant for state changes

            return;
        } else if (this.trigger.type === "event") {
            // Single event can be evaluated immediately

            if (this.trigger.content.event != event.type) {
                return;
            }

            this.scope = {};
            this.scope[device.id].event = event;

            this.action.execute(this.scope);
        } else {
            // Record event for interval processing

            this.scope[device.id].event = event;
        }
    };

    /**
     *
     * @param device
     * @param state
     */
    EventProcessor.prototype.notifyOnActorStateChange = function (actor, state) {
        this.logDebug("Receiving Actor State Change", actor.label, state);

        if (this.trigger.type == "event") {
            return;
        }
        else if (this.trigger.type == "singleStateChange" && state && state[this.trigger.content.field]) {
            this.scope = {};
            this.scope[actor.device.id] = {};
            this.scope[actor.device.id][actor.id] = {};
            this.scope[actor.device.id][actor.id].event = {
                type: "stateChange",
                state: state
            };

            this.action.execute(this.scope);
        }
        else if (this.trigger.type === "timeInterval") {
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

            this.evaluate();
        }
    };

    /**
     *
     * @param device
     * @param state
     */
    EventProcessor.prototype.notifyOnSensorStateChange = function (sensor, state) {
        this.logDebug("Receiving Sensor State Change", sensor.label, state);

        if (this.trigger.type == "event") {
            return;
        }
        else if (this.trigger.type == "singleStateChange" && state && state[this.trigger.content.field]) {
            this.scope = {};
            this.scope[sensor.device.id] = {};
            this.scope[sensor.device.id][sensor.id] = {};
            this.scope[sensor.device.id][sensor.id].event = {
                type: "stateChange",
                state: state
            };

            this.action.execute(this.scope);
        }
        else if (this.trigger.type === "timeInterval") {
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

            this.evaluate();
        }
    };

    EventProcessor.prototype.notifyOnActorOperationalStateChange = function (actor, state) {
        this.logDebug("Receiving Actor Operational State Change", actor.label, state);

        // TODO To be supported
    };

    /**
     * Processes Sensor value change
     */
    EventProcessor.prototype.notifyOnSensorValueChange = function (sensor, value) {
        this.logDebug("Receiving Sensor Value Change", sensor.label, value);

        if (this.trigger.type == "event") {
            return;
        }
        else if (this.trigger.type == "singleStateChange" && value && value[this.trigger.content.field]) {
            this.scope = {};
            this.scope[sensor.device.id] = {};
            this.scope[sensor.device.id][sensor.id] = {};
            this.scope[sensor.device.id][sensor.id].event = {
                type: "valueChange",
                value: value
            };

            this.action.execute(this.scope);
        }
        else if (this.trigger.type === "timeInterval") {
            this.logDebug("Adding Sensor Value Change to window", value);

            for (var n in state) {
                if (!this.scope[sensor.device.id]) {
                    this.scope[sensor.device.id];
                }

                if (!this.scope[sensor.device.id][sensor.id]) {
                    this.scope[sensor.device.id][sensor.id];
                }

                // Guard for incomplete state definitions

                if (!this.scope[sensor.device.id][sensor.id][n]) {
                    continue;
                }

                this.scopescope[sensor.device.id][sensor.id][n].series.push({
                    value: value[n],
                    timestamp: new Date().getTime()
                });
            }

            this.evaluate();
        }
    };

    /**
     * Notifies the Event Processor of an Event on a Sensor.
     */
    EventProcessor.prototype.notifyOnSensorEvent = function (sensor, event) {
        this.logDebug("Receiving Sensor Event", event);

        if (this.trigger.type === "singleStateChange") {
            // Events irrelevant for state changes

            return;
        }

        if (this.trigger.type === "event") {
            // Single event can be evaluated immediately

            if (this.trigger.content.event != event.type) {
                return;
            }

            // TODO We my want to pass Event Type/Data

            this.action.execute();
        } else {
            // Record event for interval processing

            this.scope[sensor.device.id][sensor.id].event = event;
        }
    };

    /**
     *
     * @param device
     * @param state
     */
    EventProcessor.prototype.notifyOnDataStateChange = function (data, state) {
        this.logDebug('Receiving Data State Change', state);

        if (this.action.type == 'pidController' && this.action.content.setPointVariable.type == 'dataField' && this.action.content.setPointVariable.data == data.id) {
            this.logDebug('Set PID Controller set point', state);

            // (Re)set PID Controller setpoint

            if (data.__type.family == 'primitive') {
                this.logDebug('Set setpoint from primitive data');

                this.action.setPidControllerSetPoint(state);
            } else {
                this.logDebug('Set setpoint from structured data', state[this.action.content.setPointVariable.field]);

                this.action.setPidControllerSetPoint(state[this.action.content.setPointVariable.field]);
            }

            // Execute PID Controller with the current state of the output/observed variable

            this.action.execute(this.getObservable(this.observables[0]).state[this.trigger.content.field]);
        }
    };

    /**
     * Start listening.
     */
    EventProcessor.prototype.start = function () {
        this.register();

        this.logDebug("Event Processor registered.");

        if (this.trigger.type === "timeInterval") {
            this.startInterval();
        }

        this.logInfo("Event Processor [" + this.label + "] listening.");
    };

    /**
     * Stop
     */
    EventProcessor.prototype.startInterval = function (condition) {
        if (this.windowInterval) {
            clearInterval(this.windowInterval);
        }

        this.windowInterval = setInterval(function () {
            this.logInfo("Complete interval");

            // Log state

            for (var n in this.observables) {
                if (this.observables[n].indexOf(".") < 0) {
                    this.logInfo(JSON.stringify(this.scope[this.observables[n]]));
                }
                else {
                    var path = this.observables[n].split(".");

                    this.logDebug(JSON.stringify(this.scope[path[0]][path[1]]));
                }
            }

            // TODO Block events to be logged hereafter

            this.evaluate(true);

            // Reset series

            for (var n in this.observables) {
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

            // Reset conditions

            for (var n in this.trigger.content.conditions) {
                if (this.trigger.content.conditions[n] == condition) {
                    continue;
                }

                this.trigger.content.conditions[n].matchTimestamp = null;

                if (this.trigger.content.conditions[n].__timeout) {
                    clearTimeout(this.trigger.content.conditions[n].__timeout);

                    delete this.trigger.content.conditions[n].__timeout;
                }
            }
        }.bind(this), this.trigger.content.interval)
    };

    /**
     * Stop
     */
    EventProcessor.prototype.stop = function () {
        this.logDebug("Stopping Event Processor");

        if (this.windowInterval) {
            clearInterval(this.windowInterval);
        }

        if (this.trigger.content) {
            for (var n in this.trigger.content.conditions) {
                if (this.trigger.content.conditions[n].__timeout) {
                    clearTimeout(this.trigger.content.conditions[n].__timeout);
                }
            }
        }
    };

    /**
     *
     * @param endOfInterval
     */
    EventProcessor.prototype.evaluate = function (endOfInterval, observable) {
        if (this.trigger.type == "singleStateChange") {
            this.action.execute(this.scope[observable].event.state[this.trigger.content.field]);
        } else if (this.trigger.type == "event") {
            if (this.trigger.content.event == this.scope[observable].event.type) {
                this.action.execute();
            }
        } else {
            this.logDebug("Scope", this.scope);

            var matchingConditions = [];

            for (var n in this.trigger.content.conditions) {
                // Already matched conditions do not have to be reevaluated

                if (this.trigger.content.conditions[n].matchTimestamp) {
                    matchingConditions.push(this.trigger.content.conditions[n]);

                    continue;
                }

                this.trigger.content.conditions[n].matchTimestamp = this.evaluateCondition(this.trigger.content.conditions[n], endOfInterval)

                this.logDebug("Match result", this.trigger.content.conditions[n].matchTimestamp);

                if (this.trigger.content.conditions[n].matchTimestamp) {
                    matchingConditions.push(this.trigger.content.conditions[n]);

                    this.startTimersForExcludeConditions(this.trigger.content.conditions[n], n);
                }
            }

            this.logDebug("Result set", matchingConditions.length, this.trigger.content.conditions.length);

            if (matchingConditions.length == this.trigger.content.conditions.length) {
                this.logDebug("All conditions matched.");
                this.action.execute();
                this.logDebug("Action executed. Restarting interval.");

                if (!endOfInterval) {
                    this.startInterval();
                }
            }
            else if (matchingConditions.length == 1) {
                this.logDebug("Single one-time condition matched. Restarting interval.");

                if (!endOfInterval) {
                    this.startInterval(matchingConditions[0]);
                }
            }
        }
    };

    /**
     *
     * @param condition
     * @param endOfInterval
     */
    EventProcessor.prototype.evaluateCondition = function (condition, endOfInterval) {
        if (endOfInterval) {
            this.logDebug("Evaluation condition for end of interval", condition);

            if (condition.cumulation === "maximum" || condition.cumulation === "minimum" ||
                condition.referencedCondition) {
                return null;
            }

            try {
                return condition.matchFunction() ? new Date().getTime() : null;
            } catch (error) {
                this.logError("Error executing match function for Event Processor [" + this.label + "]: " + error);
            }
        } else {
            this.logDebug("Evaluation condition during interval", condition);

            if (condition.cumulation != "maximum" && condition.cumulation != "minimum") {
                return null;
            }

            try {
                if (condition.referencedCondition != undefined &&
                    condition.excluded) {
                    this.logDebug("Checking referenced");
                    this.logDebug("Match Function", condition.matchFunction());
                    this.logDebug("Referenced Status", this.trigger.content.conditions[condition.referencedCondition].matchTimestamp);
                    this.logDebug("Lower", this.trigger.content.conditions[condition.referencedCondition].matchTimestamp + condition.delayInterval - condition.delayVarianceInterval <= now);
                    this.logDebug("Higher", this.trigger.content.conditions[condition.referencedCondition].matchTimestamp + condition.delayInterval + condition.delayVarianceInterval >= now);

                    var now = new Date().getTime();

                    return (this.trigger.content.conditions[condition.referencedCondition].matchTimestamp &&
                    condition.matchFunction() &&
                    this.trigger.content.conditions[condition.referencedCondition].matchTimestamp + condition.delayInterval - condition.delayVarianceInterval <= now &&
                    this.trigger.content.conditions[condition.referencedCondition].matchTimestamp + condition.delayInterval + condition.delayVarianceInterval >= now) ? new Date().getTime() : null;
                } else {
                    return condition.matchFunction() ? new Date().getTime() : null;
                }
            } catch (error) {
                this.logError("Error executing match function for Event Processor [" + this.label + "]: " + error);
            }
        }
    };

    /**
     *
     * @param condition
     * @param endOfInterval
     */
    EventProcessor.prototype.startTimersForExcludeConditions = function (condition, index) {
        this.logDebug("Timers for exclude conditions started", condition, index);

        for (var n in this.trigger.content.conditions) {
            if (this.trigger.content.conditions[n].exclude &&
                this.trigger.content.conditions[n].referencedCondition == index) {

                this.logDebug("Exclude condition timeout started", this.trigger.content.conditions[n]);

                this.trigger.content.conditions[n].__timeout = setTimeout(function () {
                    this.eventProcessor.logDebug("Checking excluded and referencing condition", this.condition);
                    if (!(this.condition.matchTimestamp = this.eventProcessor.evaluateCondition(this.condition))) {
                        this.condition.matchTimestamp = new Date().getTime();

                        this.eventProcessor.evaluate();
                    }
                }.bind({
                    eventProcessor: this,
                    condition: this.trigger.content.conditions[n]
                }), this.trigger.content.conditions[n].delayInterval + this.trigger.content.conditions[n].delayVarianceInterval);
            }
        }
    };
}

/**
 *
 */
function Scope() {
    /**
     *
     */
    Scope.prototype.logDebug = function (content) {
        console.log(content);
    };

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
        console.log("Maximum >>>>", data);

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
