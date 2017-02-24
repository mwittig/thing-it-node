module.exports = {
    metadata: {
        plugin: "binaryInput",
        label: "BacNet Binary Input",
        role: "actor",
        family: "binaryInput",
        deviceTypes: ["bacnet/bacNet"],
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
                this.publishStateChange();
                this.logDebug("presentValue: " + this.state.presentValue);
                this.logDebug(this.state);
            }.bind(this), 5000));

            this.simulationIntervals.push(setInterval(function () {
                this.state.alarmValue = Math.random() >= 0.5;
                this.publishStateChange();
                this.logDebug("alarmValue: " + this.state.alarmValue);
                this.logDebug(this.state);
            }.bind(this), 17000));

            this.simulationIntervals.push(setInterval(function () {
                this.state.outOfService = Math.random() >= 0.5;
                this.publishStateChange();
                this.logDebug("outOfService: " + this.state.outOfService);
                this.logDebug(this.state);
            }.bind(this), 61000));

        } else {
            this.logDebug("BINARY INPUT START - in normal mode");
            //this.device.nodes[this.configuration.nodeId] = {unit: this};
            //TODO: what are the correct names here?
            //this.device.objects[this.configuration.objectId] = {unit: this};
        }

        this.logDebug("BINARY INPUT START - end before resolving promise");

        deferred.resolve();

        return deferred.promise;
    };

    /**
     *
     */
    BinaryInput.prototype.stop = function () {
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
    BinaryInput.prototype.getState = function () {
        return this.state;
    };

    /**
     *
     */
    BinaryInput.prototype.setState = function (state) {

    };

    /**
     *
     */
    BinaryInput.prototype.update = function () {
        this.logDebug("Called update()");

        if (this.isSimulated()) {

        } else {

        }

        this.logDebug("State", this.state);
        this.publishStateChange();
    };

};
