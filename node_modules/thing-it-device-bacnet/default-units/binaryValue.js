module.exports = {
    metadata: {
        plugin: "binaryValue",
        label: "BacNet Binary Value",
        role: "actor",
        family: "binaryValue",
        deviceTypes: ["bacnet/bacNetDevice"],
        services: [{
            id: "on",
            label: "On"
        }, {
            id: "off",
            label: "Off"
        }, {
            id: "toggle",
            label: "Toggle"
        }],

        state: [
            {
                id: "presentValue", label: "Present Value",
                type: {
                    id: "boolean"
                }
            }, {
                id: "alarmValue", label: "Alarm Value",
                type: {
                    id: "boolean"
                }
            }, {
                id: "outOfService", label: "Out of Service",
                type: {
                    id: "boolean"
                }
            }],
        configuration: [
            {
                label: "Object Identifier",
                id: "objectId",
                type: {
                    id: "string"
                },
                defaultValue: ""
            },
            {
                label: "Object Type",
                id: "objectType",
                type: {
                    id: "string"
                },
                defaultValue: ""
            },
            {
                label: "Object Name",
                id: "objectName",
                type: {
                    id: "string"
                },
                defaultValue: ""
            },
            {
                label: "Description",
                id: "description",
                type: {
                    id: "string"
                },
                defaultValue: ""
            }]
    },
    create: function () {
        return new BinaryValue();
    }
};

var q = require('q');

/**
 *
 */
function BinaryValue() {
    /**
     *
     */
    BinaryValue.prototype.start = function () {
        this.logDebug("BINARY VALUE START");
        var deferred = q.defer();

        this.logDebug("BINARY VALUE START - change state");
        this.state = {
            presentValue: false,
            alarmValue: false,
            outOfService: false
        };

        this.logDebug("BINARY VALUE START - check if simulated");
        if (this.isSimulated()) {
            this.logDebug("BINARY VALUE START - in simulation");
            this.simulationIntervals = [];

            this.simulationIntervals.push(setInterval(function () {
                if (Math.random() > 0.6) {
                    this.toggle();
                }
            }.bind(this), 10000));

            this.simulationIntervals.push(setInterval(function () {
                this.state.alarmValue = Math.random() >= 0.5;
                this.logDebug("alarmValue: " + this.state.alarmValue);
                this.logDebug(this.state);
                this.publishStateChange();

                if (this.state.alarmValue == true) {
                    this.logDebug("ANALOG INPUT SIMULATION - publish event because of alarm");
                    this.device.publishEvent('Warning', {details: 'Something is not normal here.'});
                }
            }.bind(this), 17000));

            this.simulationIntervals.push(setInterval(function () {
                this.state.outOfService = Math.random() >= 0.5;
                this.logDebug("outOfService: " + this.state.outOfService);
                this.logDebug(this.state);
                this.publishStateChange();

                if (this.state.outOfService == true) {
                    this.logDebug("ANALOG INPUT SIMULATION - change operational state to notReachable");
                    this.operationalState = {state: 'notReachable'};
                } else {
                    this.logDebug("ANALOG INPUT SIMULATION - change operational state to normal");
                    this.operationalState = {state: 'normal'};
                }
                this.publishOperationalStateChange();
            }.bind(this), 61000));
        } else {
            this.logDebug("BINARY VALUE START - in normal mode");

        }

        deferred.resolve();

        return deferred.promise;
    };

    /**
     *
     */
    BinaryValue.prototype.setStateFromBacNet = function (value) {
        this.state.presentValue = value.value;
        this.logDebug("State", this.state);
        this.publishStateChange();
    };

    /**
     *
     */
    BinaryValue.prototype.stop = function () {
        this.logDebug("BINARY VALUE STOP");
        var deferred = q.defer();

        if (this.isSimulated()) {
            if (this.simulationIntervals) {
                for (interval in this.simulationIntervals) {
                    clearInterval(this.simulationIntervals[interval]);
                }
            }
        }

        deferred.resolve();

        return deferred.promise;
    };

    /**
     *
     */
    BinaryValue.prototype.getState = function () {
        return this.state;
    };

    /**
     *
     */
    BinaryValue.prototype.setState = function (state) {
        if (state.presentValue) {
            this.on();
        } else {
            this.off();
        }
    };

    /**
     *
     */
    BinaryValue.prototype.on = function () {
        var deferred = q.defer();

        this.logDebug("Called on()");

        if (this.isSimulated()) {

        } else {

        }

        this.state.presentValue = true;
        this.logDebug("presentValue: " + this.state.presentValue);
        this.logDebug("State", this.state);
        this.publishStateChange();

        deferred.resolve();

        return deferred.promise;
    };

    /**
     *
     */
    BinaryValue.prototype.off = function () {
        var deferred = q.defer();

        this.logDebug("Called off()");

        if (this.isSimulated()) {

        } else {

        }

        this.state.presentValue = false;
        this.logDebug("presentValue: " + this.state.presentValue);
        this.logDebug("State", this.state);
        this.publishStateChange();

        deferred.resolve();

        return deferred.promise;
    };

    /**
     *
     */
    BinaryValue.prototype.toggle = function () {
        var deferred = q.defer();

        if (this.state.presentValue) {
            this.off();
        } else {
            this.on();
        }

        deferred.resolve();

        return deferred.promise;
    };
};
