module.exports = {
    bind: function (node, scriptService) {
        utils.inheritMethods(scriptService, new ScriptService());

        scriptService.node = node;

        if (!scriptService.logLevel) {
            scriptService.logLevel = node.logLevel;
        }

        scriptService.content.script = node.preprocessScript(scriptService.content.script);

        try {
            node[scriptService.id] = function () {
                scriptService.invoke();
            };

            scriptService.logInfo("Script Service [" + scriptService.id + "] available.");
        } catch (error) {
            scriptService.logError("Failed to initialize Script Service [" + scriptService.id
                + "]:");
            scriptService.logError(error);
        }

        return scriptService;
    }
};

var q = require('q');
var utils = require("./utils");
var logger = require("./logger");

/**
 *
 */
function ScriptService() {
    this.class = "ScriptService";

    utils.inheritMethods(this, logger.create());

    /**
     * Required for logging.
     */
    ScriptService.prototype.publishMessage = function (content) {
        this.node.publishMessage(content);
    };

    /**
     *
     */
    ScriptService.prototype.invoke = function () {
        this.node.executeScript(
            this.content.script);
    };
}