module.exports = {
    metadata: {
        plugin: "analogValue",
        label: "BacNet Analog Value",
        role: "actor",
        family: "analogValue",
        deviceTypes: ["bacnet/bacNetDevice"],
        services: [{
            id: "update",
            label: "Update"
        },
        {
            id: "setPresentValue",
            label: "Set Present Value"
        }],

        state: [
            {
                id: "presentValue", label: "Present Value",
                type: {
                    id: "decimal"
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
            },
            {
                label: "Minimum Value",
                id: "minValue",
                type: {
                    id: "decimal"
                },
                defaultValue: 0
            },
            {
                label: "Maximum Value",
                id: "maxValue",
                type: {
                    id: "decimal"
                },
                defaultValue: 100
            }]
    },
    create: function () {
        return new AnalogValue();
    }
};

var q = require('q');

/**
 *
 */
function AnalogValue() {
    /**
     *
     */
    AnalogValue.prototype.start = function () {
        this.logDebug("ANALOG VALUE START");
        var deferred = q.defer();

        this.logDebug("ANALOG VALUE START - change state");
        this.state = {
            presentValue: 0.0,
            alarmValue: false,
            outOfService: false
        };

        this.logDebug("ANALOG VALUE START - check if simulated");
        if (this.isSimulated()) {
            this.logDebug("ANALOG VALUE START - in simulation");
            this.simulationIntervals = [];

            this.simulationIntervals.push(setInterval(function () {
                if (Math.random() > 0.6) {
                    this.setPresentValue(Math.random() * 100);
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
            this.logDebug("ANALOG VALUE START - in normal mode");

        }

        deferred.resolve();

        return deferred.promise;
    };

    /**
     *
     */
    AnalogValue.prototype.setStateFromBacNet = function (value) {
        this.state.presentValue = value.value;
        this.logDebug("State", this.state);
        this.publishStateChange();
    };

    /**
     *
     */
    AnalogValue.prototype.stop = function () {
        this.logDebug("ANALOG VALUE STOP");
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
    AnalogValue.prototype.getState = function () {
        return this.state;
    };

    /**
     *
     */
    AnalogValue.prototype.setState = function (state) {
        this.state = state;
    };

    /**
     *
     */
    AnalogValue.prototype.update = function () {
        var deferred = q.defer();

        this.logDebug("Called update()");

        if (this.isSimulated()) {

        } else {

        }

        this.logDebug("State", this.state);
        this.publishStateChange();

        deferred.resolve();

        return deferred.promise;
    };

    /**
     *
     */
    AnalogValue.prototype.setPresentValue = function (presentValue) {
        var deferred = q.defer();

        this.logDebug("Called setPresentValue()");

        if (this.isSimulated()) {

        } else {

        }

        this.state.presentValue = presentValue;
        this.logDebug("presentValue: " + this.state.presentValue);
        this.logDebug("State", this.state);
        this.publishStateChange();

        deferred.resolve();

        return deferred.promise;
    };
};
