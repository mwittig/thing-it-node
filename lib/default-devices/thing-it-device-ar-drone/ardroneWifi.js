module.exports = {
    metadata: {
        family: "ardrone",
        plugin: "ardroneWifi",
        label: "AR Drone (Wifi)",
        tangible: true,
        actorTypes: [],
        sensorTypes: [],
        services: [{
            id: "takeOff",
            label: "Take Off"
        }, {
            id: "land",
            label: "Land"
        }, {
            id: "turnClockwise",
            label: "Turn Clockwise", parameters: [{
                label: "angle",
                id: "Angle",
                type: {
                    id: "integer"
                }
            }]
        }],
        configuration: []
    },
    create: function (device) {
        return new ArDroneWifi();
    }
};

var utils = require("../../utils");
var q = require('q');
var arDrone = require('ar-drone');

/**
 *
 */
function ArDroneWifi() {
    /**
     *
     */
    ArDroneWifi.prototype.start = function () {
        var deferred = q.defer();
        var self = this;

        this.state = {
            longitude: 0,
            latitude: 0,
            height: 0
        };

        this.startDevice().then(function () {
            if (self.isSimulated()) {
                deferred.resolve();
            } else {
                self.drone = arDrone.createClient();

                deferred.resolve();
            }
        }).fail(function () {
            deferred.reject();
        });

        return deferred.promise;
    };

    /**
     *
     */
    ArDroneWifi.prototype.setState = function (state) {
        this.state = state;
    };

    /**
     *
     */
    ArDroneWifi.prototype.getState = function () {
        return this.state;
    };

    /**
     *
     */
    ArDroneWifi.prototype.takeOff = function () {
        if (this.isSimulated()) {
            console.log("ArDroneBluetoothLE.takeOff");
        }
        else
        {
            this.drone.takeoff();
        }

        this.publishStateChange();
    };

    /**
     *
     */
    ArDroneWifi.prototype.land = function () {
        if (this.isSimulated()) {
            console.log("ArDroneBluetoothLE.land");
        }
        else
        {
            this.drone.land();
        }

        this.publishStateChange();
    };

    /**
     *
     */
    ArDroneWifi.prototype.turnClockwise = function () {
        if (this.isSimulated()) {
            console.log("ArDroneBluetoothLE.turnClockwise");
        }
        else
        {
            this.drone.clockwise(0.5);
        }

        this.publishStateChange();
    };
}
