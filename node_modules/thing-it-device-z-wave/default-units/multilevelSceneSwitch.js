module.exports = {
    metadata: {
        plugin: "multilevelSceneSwitch",
        label: "Z-Wave Multilevel Scene Switch",
        role: "actor",
        family: "multilevelSceneSwitch",
        deviceTypes: ["z-wave/zWaveNetwork"],
        services: [{
            id: "on",
            label: "On"
        }, {
            id: "off",
            label: "Off"
        }, {
            id: "toggle",
            label: "Toggle"
        }, {
            id: "changeLevel",
            label: "Change Level"
        }],
        state: [
            {
                id: "level", label: "Level",
                type: {
                    id: "integer"
                }
            }, {
                id: "lastLevel", label: "Last Level",
                type: {
                    id: "integer"
                }
            }, {
                id: "switch", label: "Switch",
                type: {
                    id: "boolean"
                }
            }],
        configuration: [{
            label: "Node ID",
            id: "nodeId",
            type: {
                id: "integer"
            },
            defaultValue: "1"
        }, {
            label: "Default Level",
            id: "defaultLevel",
            type: {
                id: "integer"
            },
            defaultValue: "100"
        }]
    },
    create: function () {
        return new MultilevelSceneSwitch();
    }
};

var q = require('q');

/**
 *
 */
function MultilevelSceneSwitch() {
    /**
     *
     */
    MultilevelSceneSwitch.prototype.start = function () {
        var deferred = q.defer();

        this.state = {
            switch: false,
            level: 0
        };

        this.ignoreNextUpdate = false;

        if ((!this.configuration.defaultLevel) || (this.configuration.defaultLevel < 0) || (this.configuration.defaultLevel > 99)) {
            this.logDebug("Configured default level of " + this.configuration.defaultLevel + " out of range; setting last level to 99.");
            this.state.lastLevel = 99;
        } else {
            this.state.lastLevel = this.configuration.defaultLevel;
        }

        if (this.isSimulated()) {
        } else {
            this.device.nodes[this.configuration.nodeId] = {unit: this};
        }

        deferred.resolve();

        return deferred.promise;
    };

    /**
     *
     */
    MultilevelSceneSwitch.prototype.setStateFromZWave = function (comClass, value) {
        if (!this.ignoreNextUpdate) {
            if ((comClass == 38) && (value.label = "Level") && (value.value === parseInt(value.value, 10))) {
                if (value.value > 0) {
                    this.state.lastLevel = value.value;
                    this.state.switch = true;
                } else {
                    this.state.switch = false;
                }

                this.state.level = value.value;
                this.logDebug("State from Z-Wave", this.state);
                this.publishStateChange();
            } else {
                this.logDebug("Ignoring state update.", value.label, value.value);
            }
        } else {
            this.ignoreNextUpdate = false;
        }
    };

    /**
     *
     */
    MultilevelSceneSwitch.prototype.handleEventFromZWave = function (event, valueid) {
        this.logDebug("Event: " + event + " on Value ID " + valueid);
    }

    /**
     *
     */
    MultilevelSceneSwitch.prototype.handleNotificationFromZWave = function (notif, help) {
        this.logDebug(help + " (" + notif + ")");
    }

    /**
     *
     */
    MultilevelSceneSwitch.prototype.scanComplete = function () {
        this.logDebug("Received scan complete on node id " + this.configuration.nodeId + " with device type "
            + this.configuration.deviceType + ".");
    };

    /**
     *
     */
    MultilevelSceneSwitch.prototype.stop = function () {
        var deferred = q.defer();

        deferred.resolve();

        return deferred.promise;
    };

    /**
     *
     */
    MultilevelSceneSwitch.prototype.getState = function () {
        return this.state;
    };

    /**
     *
     */
    MultilevelSceneSwitch.prototype.setState = function (state) {
        if (state.level) {
            this.setLevel(state.level);
        }

        if (state.lastLevel) {
            this.state.lastLevel = state.lastLevel;
        }
    };

    /**
     *
     */
    MultilevelSceneSwitch.prototype.on = function () {
        this.logDebug("Called on()");

        if (this.isSimulated()) {

        } else {
            this.setLevel(this.state.lastLevel);
        }
    };

    /**
     *
     */
    MultilevelSceneSwitch.prototype.off = function () {
        this.logDebug("Called off()");

        if (this.isSimulated()) {

        } else {
            this.setLevel(0);
        }
    };

    /**
     *
     */
    MultilevelSceneSwitch.prototype.toggle = function () {
        if (this.state.level > 0) {
            this.off();
        } else {
            this.on();
        }
    };

    /**
     *
     */
    MultilevelSceneSwitch.prototype.setLevel = function (level) {
        this.logDebug("Setting level to " + level);

        if (level > 0){
            this.state.lastLevel = level;
            this.state.level = level;
            this.state.switch = true;
        } else {
            this.state.lastLevel = this.state.level;
            this.state.level = 0;
            this.state.switch = false;
        }

        if (this.isSimulated()) {

        } else {
            // setLevel not working reliably
            // this.device.zWave.setLevel(this.configuration.nodeId, level);
            this.device.zWave.setValue({ node_id:this.configuration.nodeId, class_id: 38, instance:1, index:0}, level);
            this.ignoreNextUpdate = true;
        }

        this.logDebug("State after setLevel", this.state);
        this.publishStateChange();
    };

    /**
     *
     */
    MultilevelSceneSwitch.prototype.setLastLevel = function (level) {
        if (this.isSimulated()) {

        } else {
            this.state.lastLevel = level;
            this.logDebug("State after setLastLevel", this.state);
            this.publishStateChange();
        }
    };

    /**
     *
     *
     */
    MultilevelSceneSwitch.prototype.changeLevel = function (parameters) {
        if ((parameters) && (parameters.level)) {
            if (parameters.level == 0) {
                this.off();
            } else {
                this.setLevel(parameters.level);
            }
        }
    };

};
