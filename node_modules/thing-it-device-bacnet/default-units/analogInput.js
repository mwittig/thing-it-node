module.exports = {
    metadata: {
        plugin: "analogInput",
        label: "BacNet Analog Input",
        role: "actor",
        family: "analogInput",
        deviceTypes: ["bacnet/bacNetDevice"],
        services: [{
            id: "update",
            label: "Update"
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
            }]
    },
    create: function () {
        return new AnalogInput();
    }
};

var q = require('q');

/**
 *
 */
function AnalogInput() {
    /**
     *
     */
    AnalogInput.prototype.start = function () {
        this.logDebug("ANALOG INPUT START");
        var deferred = q.defer();

        this.logDebug("ANALOG INPUT START - change state");
        this.state = {
            presentValue: 0.0,
            alarmValue: false,
            outOfService: false
        };

        this.logDebug("ANALOG INPUT START - check if simulated");
        if (this.isSimulated()) {
            this.logDebug("ANALOG INPUT START - in simulation");
            this.simulationIntervals = [];

            this.simulationIntervals.push(setInterval(function () {
                if (Math.random() > 0.6) {
                    this.state.presentValue = Math.random() * 100;
                    this.logDebug("presentValue: " + this.state.presentValue);
                    this.logDebug(this.state);
                    this.publishStateChange();
                }
            }.bind(this), 5000));

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
            this.logDebug("ANALOG INPUT START - in normal mode");

        }

        deferred.resolve();

        return deferred.promise;
    };

    /**
     *
     */
    AnalogInput.prototype.stop = function () {
        this.logDebug("ANALOG INPUT STOP");
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
    AnalogInput.prototype.getState = function () {
        return this.state;
    };

    /**
     *
     */
    AnalogInput.prototype.setState = function (state) {

    };

    /**
     *
     */
    AnalogInput.prototype.update = function () {
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

};
