module.exports = {
    bind: function (node, storyboard) {
        utils.inheritMethods(storyboard, new Storyboard());

        return storyboard.bind(node);
    }
};

var q = require('q');
var utils = require("./utils");
var logger = require("./logger");

/**
 * TODO - Latency corrections during execution, reconcile next timestamp
 */
function Storyboard() {
    /**
     * Required for logging.
     */
    Storyboard.prototype.publishMessage = function (content) {
        this.node.publishMessage(content);
    };

    /**
     * Required for logging.
     */
    Storyboard.prototype.bind = function (node) {
        utils.inheritMethods(this, logger.create());

        this.node = node;
        this.class = "Storyboard";
        this.status = "stopped";
        this.index = 0;

        for (var n in this.timeline) {
            for (var m in this.timeline[n].entries) {
                Action.bind(node, this.timeline[m].entries[m].action);
            }
        }

        try {
            var self = this;

            node[this.id] = function () {
                self.start();
            };

            this.logInfo("Storyboard [" + this.id + "] available.");
        } catch (error) {
            this.logError("Failed to initialize Service [" + this.id
                + "]:");
            this.logError(error);
        }

        return this;
    };

    /**
     * Required for logging.
     */
    Storyboard.prototype.clientCopy = function () {
        var copy = {
            id: this.id,
            label: this.label,
            type: this.type,
            icon: this.icon,
            photoUri: this.photoUri,
            content: {
                easingInterval: this.easingInterval,
                timeline: []
            }
        };

        for (var n in this.content.timeline) {
            var step = {
                timestamp: this.content.timeline[n].timestamp,
                label: this.content.timeline[n].label,
                entries: []
            }
            var entries = this.content.timeline[n].entries;

            for (var m in entries) {
                step.entries.push(entries[m]);
            }
        }

        return copy;
    };

    /**
     *
     */
    Storyboard.prototype.start = function () {
        this.logDebug("Starting Storyboard.");

        this.status = "playing";
        this.startTime = new Date().getTime();

        this.step();

        this.notificationInterval = setInterval(function () {
            this.node.publishStoryboardProgress(this, Math.floor(this.elapsedTime()));
        }.bind(this), 1000 /* TODO Other value configurable */)
    };

    /**
     *
     */
    Storyboard.prototype.play = function () {
        this.logDebug("Playing Storyboard.");

        this.status = "playing";
        this.startTime = new Date().getTime() - this.elapsedTimeAtPause;

        this.step();

        this.notificationInterval = setInterval(function () {
            this.node.publishStoryboardProgress(this, Math.floor(this.elapsedTime()));
        }.bind(this), 1000 /* TODO Other value configurable */)
    };

    /**
     *
     */
    Storyboard.prototype.pause = function () {
        this.logDebug("Storyboard paused.");

        clearTimeout(this.timer);
        clearTimeout(this.easingTimer);
        clearInterval(this.notificationInterval);

        this.status = "paused";
        this.elapsedTimeAtPause = this.elapsedTime();
    };

    /**
     *
     */
    Storyboard.prototype.stop = function () {
        this.logDebug("Storyboard stopped");

        clearTimeout(this.timer);
        clearTimeout(this.easingTimer);
        clearInterval(this.notificationInterval);

        this.status = "stopped";
        this.index = 0;

        this.node.publishStoryboardProgress(this, null);

        // Storyboard may have changed the data

        this.node.saveData();
    };

    /**
     *
     */
    Storyboard.prototype.elapsedTime = function () {
        return new Date().getTime() - this.startTime;
    };
    /**
     *
     */
    Storyboard.prototype.step = function (time) {
        if (this.status != "playing") {
            return;
        }

        this.timer = setTimeout(
            function () {
                this.logDebug("t[" + this.index + "] = " + this.content.timeline[this.index].timestamp
                    + " (" + this.elapsedTime() + ")");

                if (this.index < this.content.timeline.length - 1) {
                    // Check for state change animation

                    for (var n in this.content.timeline[this.index + 1].entries) {
                        var entry = this.content.timeline[this.index + 1].entries[n];

                        if (entry.type == "actorStateChange"
                            && entry.easing != null) {

                            var startStateChange = this
                                .findMatchingActorStateChange(entry,
                                    this.index);

                            this
                                .startEasingSequence(this.node[entry.device][entry.actor],
                                    startStateChange ? startStateChange.state
                                        : null,
                                    entry,
                                    this.content.timeline[this.index].timestamp,
                                    this.content.timeline[this.index + 1].timestamp);
                        }
                        else if (entry.type == "deviceStateChange"
                            && entry.easing != null) {

                            var startStateChange = this
                                .findMatchingDeviceStateChange(entry,
                                    this.index);

                            this
                                .startEasingSequence(this.node[entry.device],
                                    startStateChange ? startStateChange.state
                                        : null,
                                    entry,
                                    this.content.timeline[this.index].timestamp,
                                    this.content.timeline[this.index + 1].timestamp);
                        }
                    }

                    this.index++;

                    this.step();
                    this.execute(this.content.timeline[this.index]);
                } else {
                    this.execute(this.content.timeline[this.index]);

                    this.logDebug("Timeline completed");

                    this.stop();
                }
            }.bind(this), Math.max(0, this.content.timeline[this.index].timestamp - this.elapsedTime()));
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
        if (this.status != "playing") {
            this.logDebug("Stopping execution.");

            return;
        }

        for (var n in step.entries) {
            step.entries[n].action.execute();
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
        if (this.status != "playing") {
            this.logDebug("Interrupting easing sequence.");

            return;
        }

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

        this.easingTimer = setTimeout(function () {
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