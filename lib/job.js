module.exports = {
    bind: function (node, job) {
        utils.inheritMethods(job, new Job());

        job.node = node;

        return job;
    }
};

var q = require('q');
var moment = require('moment');
var utils = require("./utils");
var logger = require("./logger");

/**
 * TODO - Latency corrections during execution, reconcile next timestamp
 */
function Job() {
    this.class = "Job";

    utils.inheritMethods(this, logger.create());

    /**
     *
     */
    Job.prototype.activate = function () {
        this.logInfo("Job [" + this.id + "] activated.");

        // Validations

        if (this.recurrence
            && (this.recurrence == "M" || this.recurrence == "Q" || this.recurrence == "y")) {
            this
                .logError("Monthly, quarterly and yearly jobs are not supported yet.");

            return;
        }

        // Initializations

        if (!this.recurrence) {
            this.endAfterOccurences = 1;
        }

        this.occurences = 0;
        this.startTimestamp = moment(this.startTimestamp);

        this.logInfo("Raw Start Timestamp " + moment(this.startTimestamp).format());

        this.forwardStartTimestamp();
        this.calculateRepeatInterval();

        // Forward to first execution - if any

        this.logInfo("Adjusted Start Timestamp "
            + moment(this.startTimestamp).format());

        while (this.startTimestamp.valueOf() < new Date().getTime()) {
            this.occurences++;

            this.startTimestamp += this.repeatInterval;

            this.logInfo("Past execution " + this.occurences + " at "
                + moment(this.startTimestamp).format());

            if (this.occurences > this.endAfterOccurences
                || this.startTimestamp > this.endTimestamp) {
                this.logInfo("All Job occurences is in the past. Terminating.");

                return;
            }
        }

        this.activateTimestamp = new Date().getTime();
        this.startOffset = this.startTimestamp.valueOf()
            - this.activateTimestamp;

        var self = this;

        setTimeout(function () {
            if (self.recurrence) {
                self.timerInterval = setInterval(function () {
                    if (self.end.type == "endAt"
                        && new Date().getTime() >= self.end.timestamp) {
                        clearInterval(self.timerInterval);

                        return;
                    }

                    self.occurences++;

                    self.execute();

                    if (self.end.type == "endAfter"
                        && self.occurences >= self.end.occurences) {
                        clearInterval(self.timerInterval);

                        return;
                    }
                }, self.repeatInterval);
            } else {
                self.execute();
            }
        }, this.startOffset);
    };

    /**
     *
     */
    Job.prototype.forwardStartTimestamp = function () {
        this.startTimestamp = moment(this.startTimestamp);

        if (this.fromNextFullOf) {
            if (this.fromNextFullOf == "m") {
                this.startTimestamp.endOf("minute");
            } else if (this.fromNextFullOf == "h") {
                this.startTimestamp.endOf("hour");
            } else if (this.fromNextFullOf == "d") {
                this.startTimestamp.endOf("day");
            } else if (this.fromNextFullOf == "w") {
                this.startTimestamp.endOf("week");
            } else {
                throw "Unsupported value for [fromNextFullOf]: "
                + this.fromNextFullOf;
            }

            this.startTimestamp = this.startTimestamp.add("ms", 1).valueOf();
        }
    };

    /**
     *
     */
    Job.prototype.calculateRepeatInterval = function () {
        this.repeatInterval = 0;

        if (!this.factor) {
            this.factor = 1;
        }

        if (this.recurrence == "m") {
            this.repeatInterval = 1000 * 60 * this.factor;
        } else if (this.recurrence == "h") {
            this.repeatInterval = 1000 * 60 * 60 * this.factor;
        } else if (this.recurrence == "d") {
            this.repeatInterval = 1000 * 60 * 60 * 24 * this.factor;
        } else if (this.recurrence == "w") {
            this.repeatInterval = 1000 * 60 * 60 * 24 * 7 * this.factor;
        }

        return this.repeatInterval;
    };

    /**
     *
     */
    Job.prototype.elapsedTime = function () {
        return new Date().getTime() - this.activateTimestamp;
    };

    /**
     *
     */
    Job.prototype.execute = function (step) {
        this.logInfo("t = " + this.elapsedTime() / 1000);
        this.logInfo("Executing Job [" + this.label + "] (" + this.id + ").");

        if (this.action.type == "nodeService") {
            this.callNodeService(this.action.content);
        } else if (this.action.type == "deviceService") {
            this.callDeviceService(this.action.content);
        } else if (this.action.type == "actorService") {
            this.callActorService(this.action.content);
        } else if (this.action.type == "actorStateChange") {
            this.applyActorStateChange(this.action.content);
        }
    };

    /**
     *
     */
    Job.prototype.callNodeService = function (call) {
        this.logInfo("Calling Node Service " + call.service + "(");
        this.logInfo(call.parameters);
        this.logInfo(")");

        if (!this.test) {
            this.node[call.service](call.parameters);
        }
    };

    /**
     *
     */
    Job.prototype.callDeviceService = function (call) {
        this.logInfo("Calling Device Service [" + call.device + "]." + call.service + "(");
        this.logInfo(call.parameters);
        this.logInfo(")");

        if (!this.test) {
            this.node[call.device][call.service](call.parameters);
        }
    };

    /**
     *
     */
    Job.prototype.callActorService = function (call) {
        this.logInfo("Calling Actor Service [" + call.device + "][" + call.actor
            + "]." + call.service + "(");
        this.logInfo(call.parameters);
        this.logInfo(")");

        if (!this.test) {
            this.node[call.device][call.actor][call.service](call.parameters);
        }
    };
}