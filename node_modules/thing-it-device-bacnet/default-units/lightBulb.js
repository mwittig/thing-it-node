module.exports = {
    metadata: {
        plugin: "lightBulb",
        label: "Light Bulb",
        role: "actor",
        family: "lightBulb",
        deviceTypes: ["osram-lightify/lightifyGateway"],
        services: [{
            id: "on",
            label: "On"
        }, {
            id: "off",
            label: "Off"
        }, {
            id: "softOn",
            label: "Soft On"
        }, {
            id: "softOff",
            label: "Soft Off"
        }, {
            id: "toggle",
            label: "Toggle"
        }, {
            id: "setBrightnessPercent",
            label: "Set Brightness (%)"
        }],
        state: [
            {
                id: "brightness", label: "Brightness",
                type: {
                    id: "integer"
                }
            }, {
                id: "brightnessPercent", label: "Brightness (%)",
                type: {
                    id: "integer"
                }
            },
            {
                id: "reachable", label: "Reachable",
                type: {
                    id: "boolean"
                }
            }],
        configuration: [{
            label: "MAC Address",
            id: "mac",
            type: {
                id: "string"
            }
        }]
    },
    create: function () {
        return new LightBulb();
    }
};

var q = require('q');
var lightifyGateway;

/**
 *
 */
function LightBulb() {
    /**
     *
     */
    LightBulb.prototype.start = function () {
        var deferred = q.defer();

        this.state = {
            brightness: 0,
            brightnessPercent: 0,
            reachable: false
        };

        if (!this.isSimulated()) {
        }

        deferred.resolve();

        return deferred.promise;
    };

    /**
     *
     */
    LightBulb.prototype.stop = function () {
        var deferred = q.defer();

        if (this.interval) {
            clearInterval(this.interval);
        }

        deferred.resolve();

        return deferred.promise;
    };

    /**
     *
     */
    LightBulb.prototype.getState = function () {
        return this.state;
    };

    /**
     *
     */
    LightBulb.prototype.setState = function (state) {
        // TODO Needs work

        this.state = {
            brightness: state.brightness ? state.brightness : this.state.brightness,
            brightnessPercent: state.brightnessPercent ? state.brightnessPercent : this.state.brightnessPercent,
            rgbHex: state.rgbHex ? state.rgbHex : this.state.rgbHex
        };

        if (this.isSimulated()) {
            this.publishStateChange();
        }
        else {
            this.publishStateChange();
        }
    };

    /**
     *
     */
    LightBulb.prototype.on = function () {
        this.state.on = true;

        if (this.isSimulated()) {
            this.publishStateChange();
        } else {
            this.device.connector.nodeOnOff(this.configuration.mac, true).then(function() {
                this.publishStateChange();
            }.bind(this));
        }
    };

    /**
     *
     */
    LightBulb.prototype.off = function () {
        this.state.on = false;

        if (this.isSimulated()) {
            this.publishStateChange();
        } else {
            this.device.connector.nodeOnOff(this.configuration.mac, false).then(function() {
                this.publishStateChange();
            }.bind(this));
        }
    };

    /**
     *
     */
    LightBulb.prototype.softOn = function () {
        this.state.on = true;

        if (this.isSimulated()) {
            this.publishStateChange();
        } else {
            this.device.connector.nodeSoftOnOff(this.configuration.mac, true, 1000).then(function() {
                this.publishStateChange();
            }.bind(this));
        }
    };

    /**
     *
     */
    LightBulb.prototype.softOff = function () {
        this.state.on = false;

        if (this.isSimulated()) {
            this.publishStateChange();
        } else {
            this.device.connector.nodeSoftOnOff(this.configuration.mac, false, 1000).then(function() {
                this.publishStateChange();
            }.bind(this));
        }
    };

    /**
     *
     */
    LightBulb.prototype.toggle = function () {
        if (this.state.on) {
            this.off();
        }
        else {
            this.on();
        }
    };

    /**
     *
     */
    LightBulb.prototype.setBrightnessPercent = function (parameters) {
        this.state.brightnessPercent = parameters.brightnessPercent;
        this.state.brightness = parameters.brightnessPercent / 100;

        if (this.isSimulated()) {
            this.publishStateChange();
        } else {
            this.device.connector.nodeBrightness(this.configuration.mac, this.state.brightnessPercent).then(function() {
                this.publishStateChange();
            }.bind(this));
        }
    };
};
