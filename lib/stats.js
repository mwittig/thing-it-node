module.exports = {
    getInstance: function () {
        if (!instance) {
            instance = createStats();
        }
        return instance;
    }
};
let instance;

function createStats() {
    return new Stats();
}

let moment = require("moment");


function Stats() {

    let infoCount = [];
    let debugCount = [];
    let errorCount = [];


    //TODO IS DOCKER? already exists somewhere
    //TODO CPU STATS
    //TODO MEMORY STATS
    //TODO HOSTNAME
    //TODO LOCAL IP eth & wlan



    //TODO INJECT IN below because its a nodebox state which will go along the heartbeat
    //TODO make sure ther is a TIP side fallback if the data dosent exists. -outdated tins out there
    // NodeManager.prototype.getState = function (uuid) {
    //
    //     var state = {
    //         state: this.state,
    //         lastModificationTimestamp: uuid ? this.configurationsMap[uuid].configuration.lastModificationTimestamp : null,
    //         firmwareVersion: require("../package").version
    //     };
    //
    //     if (docker.container()) {
    //         state.logStream = docker.isLogStream();
    //     }
    //
    //     return state;
    // };


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
