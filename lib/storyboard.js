module.exports = {
    bind: function (node, storyboard) {
        utils.inheritMethods(storyboard, new Storyboard());

        storyboard.node = node;

        try {
            node[storyboard.id] = function () {
                storyboard.play();
            };

            this.logInfo("Storyboard [" + storyboard.id + "] available.");
        } catch (error) {
            this.logError("Failed to initialize Service [" + storyboard.id
                + "]:");
            this.logError(error);
        }

        return storyboard;
    }
};

var q = require('q');
var utils = require("./utils");
var logger = require("./logger");

/**
 * TODO - Latency corrections during execution, reconcile next timestamp
 */
function Storyboard() {
    this.class = "Storyboard";

    utils.inheritMethods(this, logger.create());

    /**
     * Required for logging.
     */
    Storyboard.prototype.publishMessage = function (content) {
        this.node.publishMessage(content);
    };

    /**
     *
     */
    Storyboard.prototype.play = function () {
        this.logDebug("Starting timeline");

        this.start = new Date().getTime();
        this.step(0, 0);
    };

    /**
     *
     */
    Storyboard.prototype.elapsedTime = function () {
        return new Date().getTime() - this.start;
    };
    /**
     *
     */
    Storyboard.prototype.step = function (index, time) {
        setTimeout(
            function () {
                this.logDebug("t = " + this.content.timeline[index].timestamp
                    + " (" + this.elapsedTime() + ")");

                if (index < this.content.timeline.length - 1) {
                    // Check for state change animation

                    for (var n in this.content.timeline[index + 1].entries) {
                        var entry = this.content.timeline[index + 1].entries[n];

                        if (entry.type == "actorStateChange"
                            && entry.easing != null) {

                            var startStateChange = this
                                .findMatchingActorStateChange(entry,
                                index);

                            this
                                .startEasingSequence(this.node[entry.device][entry.actor],
                                startStateChange ? startStateChange.state
                                    : null,
                                entry,
                                this.content.timeline[index].timestamp,
                                this.content.timeline[index + 1].timestamp);
                        }
                        else if (entry.type == "deviceStateChange"
                            && entry.easing != null) {

                            var startStateChange = this
                                .findMatchingDeviceStateChange(entry,
                                index);

                            this
                                .startEasingSequence(this.node[entry.device],
                                startStateChange ? startStateChange.state
                                    : null,
                                entry,
                                this.content.timeline[index].timestamp,
                                this.content.timeline[index + 1].timestamp);
                        }
                    }

                    this.step(index + 1,
                        this.content.timeline[index].timestamp);
                    this.execute(this.content.timeline[index]);
                } else {
                    this.execute(this.content.timeline[index]);

                    this.logDebug("Timeline completed");
                }
            }.bind(this), this.content.timeline[index].timestamp - time);
    };

    /**
     *
     */
    Storyboard.prototype.findMatchingActorStateChange = function (endEntry,
                                                                  index) {
        for (var n in this.content.timeline[index].entries) {
            var startEntry = this.content.timeline[index].entries[n];

            if (startEntry.type == "actorStateChange"
                && startEntry.device == endEntry.device
                && startEntry.actor == endEntry.actor) {
                this.logDebug("*** Matching Start Entry found");

                return startEntry;
            }
        }

        return null;
    };

    /**
     *
     */
    Storyboard.prototype.findMatchingDeviceStateChange = function (endEntry,
                                                                  index) {
        for (var n in this.content.timeline[index].entries) {
            var startEntry = this.content.timeline[index].entries[n];

            if (startEntry.type == "deviceStateChange"
                && startEntry.device == endEntry.device) {
                this.logDebug("*** Matching Start Entry found");

                return startEntry;
            }
        }

        return null;
    };

    /**
     *
     */
    Storyboard.prototype.execute = function (step) {
        for (var n in step.entries) {
            if (step.entries[n].type == "nodeServiceCall") {
                this.callNodeService(step.entries[n]);
            } else if (step.entries[n].type == "deviceServiceCall") {
                this.callDeviceService(step.entries[n]);
            } else if (step.entries[n].type == "deviceStateChange") {
                this.applyDeviceStateChange(step.entries[n]);
            } else if (step.entries[n].type == "actorServiceCall") {
                this.callActorService(step.entries[n]);
            } else if (step.entries[n].type == "actorStateChange") {
                this.applyActorStateChange(step.entries[n]);
            }
        }
    };

    /**
     *
     */
    Storyboard.prototype.callNodeService = function (call) {
        this.logDebug("Calling Node Service " + call.service + "(");
        this.logDebug(call.parameters);
        this.logDebug(")");

        if (!this.test) {
            this.node[call.service](call.parameters);
        }
    };

    /**
     *
     */
    Storyboard.prototype.callDeviceService = function (call) {
        this.logDebug("Calling Device Service [" + call.device + "]." + call.service + "(");
        this.logDebug(call.parameters);
        this.logDebug(")");

        if (!this.test) {
            this.node[call.device][call.service](call.parameters);
        }
    };

    /**
     *
     */
    Storyboard.prototype.applyDeviceStateChange = function (call) {
        this.logDebug("Apply Device State Change [" + call.device + "].setState(");
        this.logDebug(call.state);
        this.logDebug(")");

        if (!this.test) {
            this.node[call.device].setState(call.state);
            // TODO Remove
            this.node[call.device].publishStateChange();

        }
    };

    /**
     *
     */
    Storyboard.prototype.callActorService = function (call) {
        this.logDebug("Calling Actor Service [" + call.device + "][" + call.actor
            + "]." + call.service + "(");
        this.logDebug(call.parameters);
        this.logDebug(")");

        if (!this.test) {
            this.node[call.device][call.actor][call.service](call.parameters);
        }
    };

    /**
     *
     */
    Storyboard.prototype.applyActorStateChange = function (call) {
        this.logDebug("Apply Actor State Change [" + call.device + "][" + call.actor
            + "].setState(");
        this.logDebug(call.state);
        this.logDebug(")");

        if (!this.test) {
            this.node[call.device][call.actor].setState(call.state);
        }
    };

    /**
     *
     */
    Storyboard.prototype.startEasingSequence = function (unit, startState,
                                                         endStateChange, startTimestamp, endTimestamp) {
        // Calculate start state

        if (!startState) {
            startState = unit.getState();
        }

        this.logDebug("Starting easing sequence (" + startTimestamp + " to "
            + endTimestamp + ")");
        this.logDebug(startState);
        this.logDebug(endStateChange.state);

        this.stepEasingSequence(unit, startState, endStateChange,
            startTimestamp, endTimestamp, startTimestamp);
    };

    /**
     *
     */
    Storyboard.prototype.stepEasingSequence = function (unit, startState,
                                                        endStateChange, startTimestamp, endTimestamp, currentTimestamp) {
        if (currentTimestamp >= endTimestamp) {
            this.logDebug("End easing sequence");

            return;
        }

        this.logDebug("t = " + currentTimestamp + " (" + this.elapsedTime() + ")");
        this.logDebug("Execute Easing Step");

        if (this.test) {
            this.getEasingValues(startState, endStateChange.state,
                startTimestamp, endTimestamp, currentTimestamp,
                endStateChange.easing);
        } else {
            unit
                .setState(this.getEasingValues(startState,
                    endStateChange.state, startTimestamp,
                    endTimestamp, currentTimestamp,
                    endStateChange.easing));
            unit.publishStateChange();
        }

        setTimeout(function () {
            this.stepEasingSequence(unit, startState, endStateChange,
                startTimestamp, endTimestamp, currentTimestamp
                + this.content.easingInterval);
        }.bind(this), this.content.easingInterval);
    };

    /**
     *
     */
    Storyboard.prototype.getEasingValues = function (startState, endState,
                                                     startTimestamp, endTimestamp, currentTimestamp, easing) {
        var state = {};

        for (var field in endState) {
            state[field] = this.getEasingValue(startState[field],
                endState[field], startTimestamp, endTimestamp,
                currentTimestamp, easing);
            this.logDebug("" + field + " = " + state[field]);
        }

        return state;
    };

    /**
     *
     */
    Storyboard.prototype.getEasingValue = function (startValue, endValue,
                                                    startTimestamp, endTimestamp, currentTimestamp, easing) {

        return startValue + (endValue - startValue)
            / (endTimestamp - startTimestamp)
            * (currentTimestamp - startTimestamp);
    };
}