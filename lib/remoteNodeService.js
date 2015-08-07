module.exports = {
    bind: function (node, remoteNodeService) {
        utils.inheritMethods(remoteNodeService, new RemoteNodeService());

        remoteNodeService.node = node;

        if (!remoteNodeService.logLevel)
        {
            remoteNodeService.logLevel = node.logLevel;
        }

        try {
            node[remoteNodeService.id] = function () {
                remoteNodeService.invoke();
            };

            remoteNodeService.logInfo("Remote Node Service [" + remoteNodeService.id + "] available.");
        } catch (error) {
            remoteNodeService.logError("Failed to initialize Remote Node Service [" + remoteNodeService.id
                + "]:");
            remoteNodeService.logError(error);
        }

        return remoteNodeService;
    }
};

var q = require("q");
var request = require("request");
var utils = require("./utils");
var logger = require("./logger");

/**
 *
 */
function RemoteNodeService() {
    this.class = "RemoteNodeService";

    utils.inheritMethods(this, logger.create());

    /**
     * Required for logging.
     */
    RemoteNodeService.prototype.publishMessage = function (content) {
        this.node.publishMessage(content);
    };

    /**
     *
     */
    RemoteNodeService.prototype.invoke = function () {
        request.post({
            url: "http://www.thing-it.com/nodes/" + this.node + "/services" + this.service,
            body: {}
        }, function (error, response, body) {
            this.logInfo("Service called via POST: " + JSON.stringify(body));
        }.bind(this));
    };
}