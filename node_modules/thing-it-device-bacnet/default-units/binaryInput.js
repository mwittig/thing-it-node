module.exports = {
    metadata: {
        plugin: "binaryInput",
        label: "BacNet Binary Input",
        role: "actor",
        family: "binaryInput",
        deviceTypes: ["bacnet/bacNetDevice"],
        services: [{
            id: "update",
            label: "Update"
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
            }
        ]
    },
    create: function () {
        return new BinaryInput();
    }
};

var q = require('q');

/**
 *
 */
function BinaryInput() {
    /**
     *
     */
    BinaryInput.prototype.start = function () {
        this.logDebug("BINARY INPUT START");
        var deferred = q.defer();
        this.isSubscribed = false;

        this.logDebug("BINARY INPUT START - change state");
        this.state = {
            presentValue: false,
            alarmValue: false,
            outOfService: false
        };

        this.logDebug("BINARY INPUT START - check if simulated");
        if (this.isSimulated()) {
            this.logDebug("BINARY INPUT START - in simulation");
            this.simulationIntervals = [];

            this.simulationIntervals.push(setInterval(function () {
                this.state.presentValue = Math.random() >= 0.5;
                this.logDebug("presentValue: " + this.state.presentValue);
                this.logDebug(this.state);
                this.publishStateChange();
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
            this.logDebug("BINARY INPUT START - in normal mode");

            this.logDebug("BINARY INPUT START - trying to subscribe to updates for present value");
            this.device.adapter.subscribeCOV(this.configuration.objectType, this.configuration.objectId, function(notification) {
                this.logDebug('received notification');
                if (notification.propertyValue == 1) {
                    this.state.presentValue = true;
                } else {
                    this.state.presentValue = false;
                }
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
    BinaryInput.prototype.stop = function () {
        this.logDebug("BINARY INPUT STOP");
        var deferred = q.defer();

        if (this.isSimulated()) {
            if (this.simulationIntervals) {
                for (interval in this.simulationIntervals) {
                    clearInterval(this.simulationIntervals[interval]);
                }
            }

            deferred.resolve();
        } else {
            this.logDebug("BINARY INPUT STOP - trying to unsubscribe from updates for present value");

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
    BinaryInput.prototype.getState = function () {
        return this.state;
    };

    /**
     *
     */
    BinaryInput.prototype.setState = function (state) {
        this.state = state;
    };

    /**
     *
     */
    BinaryInput.prototype.update = function () {
        var deferred = q.defer();

        this.logDebug("Called update()");

        if (this.isSimulated()) {
            this.logDebug("State", this.state);
            this.publishStateChange();

            deferred.resolve();
        } else {
            this.device.adapter.readProperty(this.configuration.objectType, this.configuration.objectId, 'presentValue')
                .then(function(result) {
                    if (result.propertyValue == 1) {
                        this.state.presentValue = true;
                    } else {
                        this.state.presentValue = false;
                    }
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
