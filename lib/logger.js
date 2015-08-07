module.exports = {
    create: function () {
        return new Logger();
    }
};

var moment = require("moment");

function Logger() {
    /**
     *
     * @param content
     */
    Logger.prototype.getTimestamp = function () {
        return moment().format("l") + " " + moment().format("LTS");
    };

    /**
     *
     * @param content
     */
    Logger.prototype.log = function (level, content) {
        content = "" + this.getTimestamp() + " " + level + " " + (this.class ? this.class : "") +
            (this.label ? ("[" + this.label + "]") : "") + " " + content;

        console.log(content);

        if (this.publishMessage) {
            this.publishMessage(content);
        }
    };

    /**
     *
     * @param content
     */
    Logger.prototype.logDebug = function (content) {
        if (this.logLevel === "debug") {
            this.log("DEBUG", content);
        }
    };

    /**
     *
     * @param content
     */
    Logger.prototype.logInfo = function (content) {
        if (!this.logLevel || this.logLevel === "info" || this.logLevel === "debug") {
            this.log("INFO", content);
        }
    };

    /**
     *
     * @param content
     */
    Logger.prototype.logError = function (content) {
        if (this.logLevel == "error" || this.logLevel === "info" || this.logLevel === "debug") {
            this.log("ERROR", content);
        }
    };
};