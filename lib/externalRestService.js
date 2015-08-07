module.exports = {
    bind: function (node, externalRestService) {
        utils.inheritMethods(externalRestService, new ExternalRestService());


        externalRestService.node = node;

        if (!externalRestService.logLevel) {
            externalRestService.logLevel = node.logLevel;
        }

        console.log("Log Level: " + externalRestService.logLevel);

        try {
            node[externalRestService.id] = function () {
                externalRestService.invoke();
            };

            externalRestService.logInfo("Remote Node Service [" + externalRestService.id + "] available.");
        } catch (error) {
            externalRestService.logError("Failed to initialize Remote Node Service [" + externalRestService.id
                + "]:");
            externalRestService.logError(error);
        }

        return externalRestService;
    }
};

var q = require("q");
var request = require("request");
var utils = require("./utils");
var logger = require("./logger");

/**
 *
 */
function ExternalRestService() {
    this.class = "ExternalRestService";

    utils.inheritMethods(this, logger.create());

    /**
     * Required for logging.
     */
    ExternalRestService.prototype.publishMessage = function (content) {
        this.node.publishMessage(content);
    };

    /**
     *
     */
    ExternalRestService.prototype.invoke = function () {
        if (this.content.method === "GET") {
            request.get({
                url: this.content.url
            }, function (error, response, body) {
                this.logInfo("REST Service called via GET: " + JSON.stringify(body));
            }.bind(this));
        }
        else if (this.content.method === "POST") {
            request.post({
                url: this.content.url,
                body: {test: "test"}
            }, function (error, response, body) {
                this.logInfo("Service called via POST: " + JSON.stringify(body));
            }.bind(this));
        }
    };
}