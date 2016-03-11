module.exports = {
    metadata: {
        plugin: "genericDevice",
        label: "Z-Wave Generic Device",
        role: "actor",
        family: "genericDevice",
        deviceTypes: ["z-wave/zWaveNetwork"],
        services: [],
        state: [],
        configuration: [
            {
                label: "Node ID",
                id: "nodeId",
                type: {
                    id: "integer"
                },
                defaultValue: "1"
            },
            {
                label: "DeviceType",
                id: "deviceType",
                type: {
                    id: "string"
                },
                defaultValue: ""
            },
        ]
    },
    create: function () {
        return new GenericDevice();
    }
};

var q = require('q');

/**
 *
 */
function GenericDevice() {
    /**
     *
     */
    GenericDevice.prototype.start = function () {
        var deferred = q.defer();

        this.state = {
            switch: false,
            power: 0
        };

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
    GenericDevice.prototype.setStateFromZWave = function (comClass, value) {
        this.logDebug("State - Class: " + comClass + ", Label: " + value.label + ", value: " + value.value
        + " on node id " + this.configuration.nodeId + " with device type " + this.configuration.deviceType + ".");
    };

    /**
     *
     */
    GenericDevice.prototype.handleEventFromZWave = function (event, valueid) {
        this.logDebug("Event: " + event + " on Value ID " + valueid
            + " on node id " + this.configuration.nodeId + " with device type " + this.configuration.deviceType + ".");
    }

    /**
     *
     */
    GenericDevice.prototype.handleNotificationFromZWave = function (notif, help) {
        this.logDebug(help + " (" + notif + ")"
            + " on node id " + this.configuration.nodeId + " with device type " + this.configuration.deviceType + ".");
    }

    /**
     *
     */
    GenericDevice.prototype.scanComplete = function () {
        this.logDebug("Received scan complete on node id " + this.configuration.nodeId + " with device type "
            + this.configuration.deviceType + ".");
        this.logDebug("Polling Frequency (ms): " + this.device.zWave.getPollInterval());
        this.device.zWave.requestAllConfigParams(this.configuration.nodeId);
        this.device.zWave.enablePoll(this.configuration.nodeId, 32);
        this.device.zWave.enablePoll(this.configuration.nodeId, 48);
        this.device.zWave.enablePoll(this.configuration.nodeId, 49);
    };

    /**
     *
     */
    GenericDevice.prototype.stop = function () {
        var deferred = q.defer();

        deferred.resolve();

        return deferred.promise;
    };

    /**
     *
     */
    GenericDevice.prototype.getState = function () {
        return this.state;
    };

    /**
     *
     */
    GenericDevice.prototype.setState = function (state) {
    };
};
