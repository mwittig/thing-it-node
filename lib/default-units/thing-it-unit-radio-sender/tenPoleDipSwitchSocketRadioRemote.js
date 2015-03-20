module.exports = {
    metadata: {
        plugin: "tenPoleDipSwitchSocketRadioRemote",
        role: "actor",
        label: "Ten pole Dip Switch Socket Radio Remote",
        family: "tenPoleDipSwitchSocketRadioRemote",
        baseUnit: "radio-sender/radioRemote",
        deviceTypes: ["microcontroller/microcontroller"],
        configuration: [{
            label: "System Code",
            id: "systemCode",
            type: {
                id: "integer"
            },
            defaultValue: 8
        }, {
            label: "Unit Code",
            id: "unitCode",
            type: {
                id: "integer"
            },
            defaultValue: 16
        }],
        services: [{
            id: "powerOn",
            label: "Power On"
        }, {
            id: "powerOff",
            label: "Power Off"
        }], configuration: []
    },
    create: function () {
        var unit = new TenPoleDipSwitchSocketRemote();

        utils.inheritMethods(unit, radioRemote.create());

        return unit;
    }
};

var utils = require("../../utils");
var radioRemote = require("./radioRemote");
var q = require('q');

var powerOnCommand = {
    command: "POWER ON",
    pin: [7],
    system_code: [0, 1, 0, 0, 0],
    unit_code: [1, 0, 0, 0, 0],
    mode: [1, 0]

};
var powerOffCommand = {
    command: "POWER OFF",
    pin: [7],
    system_code: [0, 1, 0, 0, 0],
    unit_code: [1, 0, 0, 0, 0],
    mode: [0, 1]
};


/**
 *
 */
function TenPoleDipSwitchSocketRemote() {
    /**
     *
     */
    TenPoleDipSwitchSocketRemote.prototype.initializeState = function () {
        this.state = {on: false, channel: 1};
    };

    /**
     *
     */
    TenPoleDipSwitchSocketRemote.prototype.powerOn = function () {
        var self = this;

        this.sendCommand(powerOnCommand).then(function () {
            self.state.on = true;

            self.publishStateChange();
        }).fail();
    };

    /**
     *
     */
    TenPoleDipSwitchSocketRemote.prototype.powerOff = function () {
        var self = this;

        this.sendCommand(powerOffCommand).then(function () {
            self.state.on = false;

            self.publishStateChange();
        }).fail();
    };
}