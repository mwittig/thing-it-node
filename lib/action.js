module.exports = {
    bind: function (node, action) {
        utils.inheritMethods(action, new Action());

        action.__node = node;

        // Script preprocessing

        if (action.type === "script") {
            action.__callbackScript = node
                .preprocessScript(action.content.script);
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
    this.class = "Action";

    utils.inheritMethods(this, logger.create());

    /**
     * Required for logging.
     */
    Action.prototype.execute = function () {
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
        } catch (error) {
            this.logError("Exception in script: ", error);
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
}