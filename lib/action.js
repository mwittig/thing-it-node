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
            action.__pidController = new Controller({
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
var Controller = require('node-pid-controller');

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
                    this.node.executeScript(this.__callbackScript);
                } catch (error) {
                    this.logError("Exception in script: ", error);
                }
            }
            else if (this.type === "nodeService") {
                this.__node[this.content.service]();
            }
            else if (this.type === "deviceService") {
                this.__node.findDevice(this.content.device)[this.content.service]();
            }
            else if (this.type === "actorService") {
                this.__node.findDevice(this.content.device).findActor(this.content.actor)[this.content.service]();
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
                        this.logDebug('Set state on Device', this.__node[this.content.controlVariable.device].id);

                        this.__node[this.content.controlVariable.device].setState(outputState);
                    }
                } else {
                    // Data
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