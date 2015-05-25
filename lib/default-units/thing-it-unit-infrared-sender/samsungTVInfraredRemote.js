module.exports = {
    metadata: {
        plugin: "samsungTVInfraredRemote",
        role: "actor",
        label: "Samsung TV Infrared Remote",
        family: "samsungTVInfraredRemote",
        baseUnit: "infrared-sender/infraredRemote",
        deviceTypes: ["microcontroller/microcontroller"],
        services: [{
            id: "powerOn",
            label: "Power On"
        }, {
            id: "powerOff",
            label: "Power Off"
        }, {
            id: "channelDown",
            label: "Channel Down"
        }, {
            id: "channelUp",
            label: "Channel Up"
        }], configuration: []
    },
    create: function () {
        var unit = new SamsungTVInfraredRemote();

        utils.inheritMethods(unit, infraredRemote.create());

        return unit;
    }
};

var utils = require("../../utils");
var infraredRemote = require("./infraredRemote");
var q = require('q');

var powerOnCommand = {};
var powerOffCommand = {};
var channelUpCommand = {
    command: "CHANNEL UP",
    cookie1: "1:1",
    cookie2: 1,
    frequency: 38000,
    cookie3: 1,
    cookie4: 1,
    sequence: [172, 172, 22, 64, 22, 64, 22, 64, 22, 21, 22, 21, 22, 21, 22, 21, 22, 21, 22, 64, 22, 64, 22, 64, 22, 21, 22, 21, 22, 21, 22, 21, 22, 21, 22, 21, 22, 64, 22, 21, 22, 21, 22, 64, 22, 21, 22, 21, 22, 21, 22, 64, 22, 21, 22, 64, 22, 64, 22, 21, 22, 64, 22, 64, 22, 64, 22, 1820],
    quadruplets: "0000 006D 0000 0022 00ac 00ac 0016 0040 0016 0040 0016 0040 0016 0015 0016 0015 0016 0015 0016 0015 0016 0015 0016 0040 0016 0040 0016 0040 0016 0015 0016 0015 0016 0015 0016 0015 0016 0015 0016 0015 0016 0040 0016 0015 0016 0015 0016 0040 0016 0015 0016 0015 0016 0015 0016 0040 0016 0015 0016 0040 0016 0040 0016 0015 0016 0040 0016 0040 0016 0040 0016 071c"
};

var channelDownCommand = {
    command: "CHANNEL DOWN",
    cookie: "1:1",
    cookie2: 1,
    frequency: 38000,
    cookie3: 1,
    cookie4: 1,
    sequence: [172, 172, 22, 64, 22, 64, 22, 64, 22, 21, 22, 21, 22, 21, 22, 21, 22, 21, 22, 64, 22, 64, 22, 64, 22, 21, 22, 21, 22, 21, 22, 21, 22, 21, 22, 21, 22, 21, 22, 21, 22, 21, 22, 64, 22, 21, 22, 21, 22, 21, 22, 64, 22, 64, 22, 64, 22, 64, 22, 21, 22, 64, 22, 64, 22, 64, 22, 1820],
    quadruplets: "0000 006D 0000 0022 00ac 00ac 0016 0040 0016 0040 0016 0040 0016 0015 0016 0015 0016 0015 0016 0015 0016 0015 0016 0040 0016 0040 0016 0040 0016 0015 0016 0015 0016 0015 0016 0015 0016 0015 0016 0015 0016 0015 0016 0015 0016 0015 0016 0040 0016 0015 0016 0015 0016 0015 0016 0040 0016 0040 0016 0040 0016 0040 0016 0015 0016 0040 0016 0040 0016 0040 0016 071c"
};

/**
 *
 */
function SamsungTVInfraredRemote() {
    /**
     *
     */
    SamsungTVInfraredRemote.prototype.initializeState = function () {
        this.state = {on: false, channel: 1};
    };

    /**
     *
     */
    SamsungTVInfraredRemote.prototype.getState = function () {
        return this.state;
    };

    /**
     *
     */
    SamsungTVInfraredRemote.prototype.powerOn = function () {
        var self = this;

        this.sendCommand(powerOnCommand).then(function () {
            self.state.on = true;

            self.publishStateChange();
        }).fail();
    };

    /**
     *
     */
    SamsungTVInfraredRemote.prototype.powerOff = function () {
        var self = this;

        this.sendCommand(powerOffCommand).then(function () {
            self.state.on = false;

            self.publishStateChange();
        }).fail();
    };

    /**
     *
     */
    SamsungTVInfraredRemote.prototype.channelUp = function () {
        var self = this;

        this.sendCommand(channelUpCommand).then(function () {
            ++self.state.channel;

            self.publishStateChange();
        }).fail();
    };

    /**
     *
     */
    SamsungTVInfraredRemote.prototype.channelDown = function () {
        var self = this;

        this.sendCommand(channelDownCommand).then(function () {
            --self.state.channel;

            self.publishStateChange();
        }).fail();
    };
};