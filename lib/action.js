module.exports = {
    bind: function (node, action) {
        utils.inheritMethods(action, new Action());
        utils.inheritMethods(action, logger.create());

        action.class = "Action";
        action.__node = node;
        action.logLevel = node.logLevel;

        // Script preprocessing

        if (action.type === "script") {
            action.__callbackScript = node
                .preprocessScript(action.content.script);
        } else if (action.type === 'pidController') {
            action.__pidController = new PidController().initialize({
                k_p: action.content.proportionalParameter,
                k_i: action.content.integralParameter,
                k_d: action.content.differentialParameter
            });

            // TODO Initialize setpoint from data or device state
            // Device states etc. need to be initialized before

            action.__pidController.setTarget(120);
        }

        return action;
    }
};

var q = require('q');
var utils = require("./utils");
var logger = require("./logger");

/**
 *
 */
function Action() {
    /**
     * Required for logging.
     */
    Action.prototype.execute = function (input) {
        try {
            if (this.type === "script") {
                try {
                    this.__node.executeScript(this.__callbackScript);
                } catch (error) {
                    this.logError("Exception in script: ", error);
                }
            }
            else if (this.type === "nodeService") {
                this.__node[this.content.service](this.content.parameters);
            }
            else if (this.type === "deviceService") {
                this.__node.findDevice(this.content.device)[this.content.service](this.content.parameters);
            }
            else if (this.type === "actorService") {
                this.logDebug('Execute Actor Service', this.content.device, this.content.actor, this.content.service);

                this.__node.findDevice(this.content.device).findActor(this.content.actor)[this.content.service](this.content.parameters);
            }
            else if (this.type === "pidController") {
                this.logDebug('Execute PID Controller', input);

                var outputState = {};

                outputState[this.content.controlVariable.field] = this.__pidController.update(input);

                this.logDebug('PID Output', outputState[this.content.controlVariable.field]);

                if (this.content.controlVariable.device) {
                    if (this.content.actor) {
                        this.__node[this.content.controlVariable.device][this.content.controlVariable.actor].setState(outputState);
                    } else {
                        this.__node[this.content.controlVariable.device].setState(outputState);
                    }
                } else {
                    // TODO Data
                }
            }
        } catch (error) {
            this.logError("Exception in Action Execution: ", error);
        }
    };

    /**
     * Required for logging.
     */
    Action.prototype.clientCopy = function () {
        var copy = {type: this.type, content: {}};

        if (this.type === "script") {
            copy.content.script = this.content.script;
        }
        else if (this.type === "nodeService") {
            copy.content.service = this.content.service;
        }
        else if (this.type === "deviceService") {
            copy.content.service = this.content.service;
            copy.content.device = this.content.device;
        }
        else if (this.type === "actorService") {
            copy.content.service = this.content.service;
            copy.content.device = this.content.device;
            copy.content.actor = this.content.actor;
        }

        return copy;
    };

    /**
     * Required for logging.
     */
    Action.prototype.setPidControllerSetPoint = function (setPoint) {
        this.logInfo('setPidControllerSetPoint', setPoint);
        this.__pidController.setTarget(setPoint);
    };
}

function PidController() {
    PidController.prototype.initialize = function (k_p, k_i, k_d, dt) {
        var i_max;

        if (typeof k_p === 'object') {
            var options = k_p;
            k_p = options.k_p;
            k_i = options.k_i;
            k_d = options.k_d;
            dt = options.dt;
            i_max = options.i_max;
        }

        // PID constants

        this.k_p = (typeof k_p === 'number') ? k_p : 1;
        this.k_i = k_i || 0;
        this.k_d = k_d || 0;

        // Interval of time between two updates
        // If not set, it will be automatically calculated

        this.dt = dt || 0;

        // Maximum absolute value of sumError

        this.i_max = i_max || 0;
        this.sumError = 0;
        this.lastError = 0;
        this.lastTime = 0;
        this.target = 0; // default value, can be modified with .setTarget

        return this;
    };

    PidController.prototype.setTarget = function (target) {
        this.target = target;
    };

    PidController.prototype.update = function (currentValue) {
        this.currentValue = currentValue;

        // Calculate dt

        var dt = this.dt;

        if (!dt) {
            var currentTime = Date.now();
            if (this.lastTime === 0) { // First time update() is called
                dt = 0;
            } else {
                dt = (currentTime - this.lastTime) / 1000; // in seconds
            }
            this.lastTime = currentTime;
        }

        if (typeof dt !== 'number' || dt === 0) {
            dt = 1;
        }

        var error = (this.target - this.currentValue);

        this.sumError = this.sumError + error * dt;

        if (this.i_max > 0 && Math.abs(this.sumError) > this.i_max) {
            var sumSign = (this.sumError > 0) ? 1 : -1;
            this.sumError = sumSign * this.i_max;
        }

        var dError = (error - this.lastError) / dt;

        this.lastError = error;

        return (this.k_p * error) + (this.k_i * this.sumError) + (this.k_d * dError);
    };

    PidController.prototype.reset = function () {
        this.sumError = 0;
        this.lastError = 0;
        this.lastTime = 0;
    };
}