module.exports = {
    getInstance: function () {
        if (!instance) {
            instance = createStats();
        }
        return instance;
    }
};
var instance;

function createStats() {
    return new Stats();
}

var moment = require("moment");


function Stats() {

    var infoCount = [];
    var debugCount = [];
    var errorCount = [];


    /**
     *
     * @param content
     */
    Stats.prototype.getInfoCount = function () {
        if (this.logLevel === "debug") {
            var args = [this.prefix("DEBUG")];

            args.push.apply(args, arguments);

            console.log.apply(console, args);
        }
    };

    /**
     *
     * @param content
     */
    Stats.prototype.getInfoCount = function (minutes) {
        if (minutes) {

        } else {
            return infoCount.length;
        }
    };

    /**
     *
     * @param content
     */
    Stats.prototype.getDebugCount = function (minutes) {
        return debugCount;
    };

    /**
     *
     * @param content
     */
    Stats.prototype.getErrorCount = function (minutes) {

        return errorCount;
    };


    /**
     *
     * @param content
     */
    Stats.prototype.newInfoLog = function () {
        infoCount.push(Date.now());
    };

    /**
     *
     * @param content
     */
    Stats.prototype.newDebugLog = function () {
        debugCount.push(Date.now());
    };

    /**
     *
     * @param content
     */
    Stats.prototype.newErrorLog = function () {
        errorCount.push(Date.now());
    };
}
