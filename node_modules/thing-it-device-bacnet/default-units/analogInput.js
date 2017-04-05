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
            }
        ]
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
        this.isSubscribed = false;

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

            deferred.resolve();
        } else {
            this.logDebug("ANALOG INPUT START - in normal mode");

            this.logDebug("ANALOG INPUT START - trying to subscribe to updates for present value");
            this.device.adapter.subscribeCOV(this.configuration.objectType, this.configuration.objectId, function(notification) {
                this.logDebug('received notification');

                this.state.presentValue = notification.propertyValue;
                this.logDebug("presentValue: " + this.state.presentValue);
                this.logDebug("State", this.state);
                this.publishStateChange();
            }.bind(this))
                .then(function(result) {
                    this.logDebug('successfully subscribed');
                    this.isSubscribed = true;
                    deferred.resolve();
                }.bind(this))
                .fail(function(result) {
                    this.logDebug('it did not work');
                    deferred.reject('it did not work');
                }.bind(this));
        }

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

            deferred.resolve();
        } else {
            this.logDebug("ANALOG INPUT STOP - trying to unsubscribe from updates for present value");

            this.device.adapter.unsubscribeCOV(this.configuration.objectType, this.configuration.objectId)
                .then(function(result) {
                    this.logDebug('successfully unsubscribed');
                    deferred.resolve();
                }.bind(this))
                .fail(function(result) {
                    this.logDebug('it did not work');
                    deferred.reject('it did not work');
                }.bind(this));
        }

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
        this.state = state;
    };

    /**
     *
     */
    AnalogInput.prototype.update = function () {
        var deferred = q.defer();

        this.logDebug("Called update()");

        if (this.isSimulated()) {
            this.logDebug("State", this.state);
            this.publishStateChange();

            deferred.resolve();
        } else {
            this.device.adapter.readProperty(this.configuration.objectType, this.configuration.objectId, 'presentValue')
                .then(function(result) {
                    this.state.presentValue = result.propertyValue;
                    this.logDebug("presentValue: " + this.state.presentValue);
                    this.logDebug("State", this.state);
                    this.publishStateChange();

                    deferred.resolve();
                }.bind(this))
                .fail(function(result) {
                    this.logDebug('it did not work');
                    deferred.reject('it did not work');
                }.bind(this));
        }

        return deferred.promise;
    };

};
