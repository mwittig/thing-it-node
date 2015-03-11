module.exports = {
    metadata: {
        plugin: "iRobotRoombaInfraredRemote",
        role: "actor",
        label: "iRobot Roomba Infrared Remote",
        family: "light",
        baseUnit: "infrared-sender/infraredRemote",
        deviceTypes: ["microcontroller/microcontroller"],
        services: [{
            id: "start",
            label: "Start"
        }, {
            id: "stop",
            label: "Stop"
        }, {
            id: "dock",
            label: "Dock"
        }]
    },
    create: function () {
        var unit = new IRobotRoombaInfraredRemote();

        utils.inheritMethods(unit, infraredRemote.create());

        return unit;
    }
};

var utils = require("../../utils");
var infraredRemote = require("./infraredRemote");
var q = require('q');

var dockCommand = {};

/**
 *
 */
function IRobotRoombaInfraredRemote() {

    /**
     *
     */
    IRobotRoombaInfraredRemote.prototype.initializeState = function () {
        this.state = {dock: true};
    };
    /**
     *
     */
    /**
     *
     */
    IRobotRoombaInfraredRemote.prototype.dock = function () {
        var self = this;

        this.sendCommand(dockCommand).then(function () {
            self.state.dock = true;
        }).fail();
    };
};