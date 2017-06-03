module.exports = {
    bind: function (node, service) {
        utils.inheritMethods(service, new Service());

        service.node = node;

        // TODO in bind method

        if (!service.logLevel) {
            service.logLevel = node.logLevel;
        }

        if (!service.content) {
            service.content = {};
        }

        if (service.type === "script") {
            service.content.script = node.preprocessScript(service.content.script);
        }

        try {
            node[service.id] = function (parameters) {
                service.invoke(parameters);
            };

            service.logInfo("Script Service [" + service.id + "] available.");
        } catch (error) {
            service.logError("Failed to initialize Script Service [" + service.id
                + "]:");
            service.logError(error);
        }

        return service;
    }
};

var q = require('q');
var nodemailer = require("nodemailer");
var utils = require("./utils");
var logger = require("./logger");

/**
 *
 */
function Service() {
    this.class = "Service";

    utils.inheritMethods(this, logger.create());

    /**
     * Required for logging.
     */
    Service.prototype.clientCopy = function () {
        var copy = {
            id: this.id,
            label: this.label,
            type: this.type,
            parameters: this.parameters,
            icon: this.icon
        };

        if (this.type === "script" && this.content && this.content.script) {
            copy.content = {script: this.content.script.slice(0)};
        }
        else {
            copy.content = this.content;
        }

        return copy;
    };

    /**
     * Required for logging.
     */
    Service.prototype.publishMessage = function (content) {
        this.node.publishMessage(content);
    };

    /**
     *
     */
    Service.prototype.invoke = function (parameters) {
        if (this.type === "externalRestService") {
            this.invokeExternalRestService(parameters);
        } else if (this.type === "remoteNodeService") {
            this.invokeRemoteNodeService(parameters);
        } else if (this.type === "eMailService") {
            this.invokeEMailService();
        } else if (this.type === "flow") {
            this.startFlow(parameters);
        } else {
            if (this.content && this.content.script) {
                this.node.executeScript(this.content.script);

                // Script may have changed the data

                this.node.saveData();
            }
        }
    };

    /**
     *
     */
    Service.prototype.invokeExternalRestService = function () {
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

    /**
     *
     */
    Service.prototype.startFlow = function (parameters) {
        this.logDebug("Starting Flow [" + this.content.flow + "].");
        this.node.publishFlowStart(this, parameters);
    };

    /**
     *
     */
    Service.prototype.invokeRemoteNodeService = function () {
        request.post({
            url: "http://www.thing-it.com/nodes/" + this.node + "/services" + this.service,
            body: {}
        }, function (error, response, body) {
            this.logInfo("Service called via POST: " + JSON.stringify(body));
        }.bind(this));
    };

    /**
     *
     */
    Service.prototype.invokeEMailService = function () {
        if (!this.transporter) {
            this.transporter = nodemailer.createTransport({
                service: this.content.provider,
                auth: {
                    user: this.content.user,
                    pass: this.content.password
                }
            });
        }

        try {
            this.transporter
                .sendMail(
                    {
                        from: this.content.from,
                        to: this.content.to,
                        subject: "test",
                        text: "test",
                        html: "test"
                    }, function (error, response) {
                        if (error) {
                            console.log(error);
                        }
                    });
        }
        catch (error) {
            console.log(error);

            deferred
                .reject(error);
        }
    };
}