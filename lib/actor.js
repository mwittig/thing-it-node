module.exports = {
    bind: function (device, actor) {
        utils.inheritMethods(actor, new Actor());
        utils.inheritMethods(actor, require(device.findActorType(actor.type).modulePath).create());

        // TODO Put in bind() method

        actor.device = device;
        actor.eventProcessors = [];
        device[actor.id] = actor;

        return actor;
    }
};

var q = require('q');
var utils = require("./utils");
var logger = require("./logger");

/**
 *
 */
function Actor() {
    this.class = "Actor";

    utils.inheritMethods(this, logger.create());

    /**
     * Required for logging.
     */
    Actor.prototype.publishMessage = function (content) {
        this.device.node.publishMessage(content);
    };

    /**
     *
     * @returns {{id: *, label: *, type: *, configuration: *}}
     */
    Actor.prototype.clientCopy = function () {
        return {
            id: this.id,
            label: this.label,
            type: this.type,
            configuration: this.configuration // TODO Full copy?
        };
    };

    /**
     *
     */
    Actor.prototype.startActor = function () {
        var deferred = q.defer();

        // For logging

        this.class = "Actor";
        this.operationalState = {state: 'normal'};

        this.logInfo("Starting Actor [" + this.label + "]");

        this.start().then(function () {
            try {
                this.publishOperationalStateChange();
                this.publishStateChange();

                this.logInfo("Actor [" + this.label + "] started.");

                deferred.resolve();
            } catch (error) {
                this.logError(x);

                deferred.reject("Failed to start Actor [" + self.label
                    + "] started: " + error);
            }
        }.bind(this)).fail(function () {
        }.bind(this));

        return deferred.promise;
    };

    /**
     *
     */
    Actor.prototype.stopActor = function () {
        var deferred = q.defer();

        if (this.stop) {
            this.stop();
        }

        this.logInfo("Actor [" + this.name + "] stopped.");
        deferred.resolve();

        return deferred.promise;
    };

    /**
     *
     */
    Actor.prototype.publishOperationalStateChange = function () {
        for (var n in this.eventProcessors) {
            this.eventProcessors[n].notifyOnActorOperationalStateChange(this, this.operationalState);
        }

        this.device.node.publishActorOperationalStateChange(this.device, this, this
            .operationalState);
    };

    /**
     *
     */
    Actor.prototype.publishStateChange = function () {
        for (var n in this.eventProcessors) {
            this.eventProcessors[n].notifyOnActorStateChange(this, this.operationalState);
        }

        this.device.node.publishActorStateChange(this.device, this, this
            .getState());
    };

    /**
     *
     */
    Actor.prototype.publishStateChangeHistory = function (history) {
        this.device.node.publishActorStateChangeHistory(this.device, this, history);
    };

    /**
     *
     */
    Actor.prototype.isSimulated = function () {
        return this.configuration.simulated || this.device.isSimulated();
    };
}