module.exports = {
    bind: function (node, service) {
        utils.inheritMethods(service, new Service());

        service.node = node;

        // TODO in bind method

        if (!service.logLevel) {
            service.logLevel = node.logLevel;
        }

        if (service.type === "scriptService") {
            service.content.script = node.preprocessScript(service.content.script);
        }

        try {
            node[service.id] = function () {
                service.invoke();
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
    Service.prototype.publishMessage = function (content) {
        this.node.publishMessage(content);
    };

    /**
     *
     */
    Service.prototype.invoke = function () {
        if (this.type === "externalRestService") {
            this.invokeExternalRestService();
        } else if (this.type === "remoteNodeService") {
            this.invokeRemoteNodeService();
        } else if (this.type === "eMailService") {
            this.invokeEMailService();
        } else {
            if (this.content && this.content.script) {
                this.node.executeScript(
                    this.content.script);
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