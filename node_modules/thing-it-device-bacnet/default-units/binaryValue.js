module.exports = {
    metadata: {
        plugin: "binaryValue",
        label: "BacNet Binary Value",
        role: "actor",
        family: "binaryValue",
        deviceTypes: ["bacnet/bacNet"],
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
                    id: "integer"
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
        var deferred = q.defer();

        this.state = {
            presentValue: false,
            alarmValue: false,
            outOfService: false
        };

        if (this.isSimulated()) {
            this.simulationIntervals = [];

            this.simulationIntervals.push(setInterval(function () {
                if (Math.random() > 0.6) {
                    this.toggle();
                    this.logDebug("presentValue: " + this.state.presentValue);
                }
            }.bind(this), 10000));

            this.simulationIntervals.push(setInterval(function () {
                this.state.alarmValue = Math.random() >= 0.5;
                this.publishStateChange();
                this.logDebug(this.state);
                this.logDebug("alarmValue: " + this.state.alarmValue);
            }.bind(this), 17000));

            this.simulationIntervals.push(setInterval(function () {
                this.state.outOfService = Math.random() >= 0.5;
                this.publishStateChange();
                this.logDebug(this.state);
                this.logDebug("outOfService: " + this.state.outOfService);
            }.bind(this), 61000));
        } else {

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
        this.logDebug("Called on()");

        if (this.isSimulated()) {

        } else {

        }

        this.state.presentValue = true;
        this.logDebug("State", this.state);
        this.publishStateChange();
    };

    /**
     *
     */
    BinaryValue.prototype.off = function () {
        this.logDebug("Called off()");

        if (this.isSimulated()) {

        } else {

        }

        this.state.presentValue = false;
        this.logDebug("State", this.state);
        this.publishStateChange();
    };

    /**
     *
     */
    BinaryValue.prototype.toggle = function () {
        if (this.state.presentValue) {
            this.off();
        } else {
            this.on();
        }
    };
};
