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
            id: "up",
            label: "Up"
        }, {
            id: "down",
            label: "Down"
        }, {
            id: "clockwise",
            label: "Turn Clockwise", parameters: [{
                label: "angle",
                id: "Angle",
                type: {
                    id: "integer"
                }
            }]
        }, {
            id: "counterClockwise",
            label: "Turn Counter-Clockwise"
        }, {
            id: "left",
            label: "Turn Left"
        }, {
            id: "right",
            label: "Turn Right"
        }, {
            id: "front",
            label: "Move Forward"
        }, {
            id: "back",
            label: "Move Backward"
        }],
        configuration: [{id: "ip", label: "IP-Address", type: {id: "string"}, default: "192.168.1.1"},
            {id: "frameRate", label: "Frame Rate", type: {id: "integer"}, default: 5},
            {id: "imageSize", label: "Image Size", type: {id: "integer"}}]
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
            altitude: 0,
            batteryPercentage: 0,
            flightState: "landed"
        };

        if (self.isSimulated()) {
            deferred.resolve();
        } else {
            self.drone = arDrone.createClient({
                ip: self.configuration.ip,
                frameRate: self.configuration.frameRate,
                imageSize: self.configuration.imageSize,
                "general:navdata_demo": "FALSE"
            });

            self.drone.on("navdata", function (event) {
                console.log(event);
            });

            self.drone.on("landed", function () {
                self.state.flightState = "landed";

                self.publishStateChange();
            });

            self.drone.on("hovering", function () {
                self.state.flightState = "hovering";

                self.publishStateChange();
            });

            self.drone.on("flying", function () {
                self.state.flightState = "flying";

                self.publishStateChange();
            });

            self.drone.on("landing", function () {
                self.state.flightState = "landing";

                self.publishStateChange();
            });

            self.drone.on("batteryChange", function () {
                console.log("batteryChange");
                console.log(event);

                self.state.batteryPercentage = 4711;

                self.publishStateChange();
            });

            self.drone.on("altitudeChange", function (event) {
                console.log("altitudeChange");
                console.log(event);

                self.state.altitude = 4711;

                self.publishStateChange();
            });

            deferred.resolve();
        }

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
        else {
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
        else {
            this.drone.land();
        }

        this.publishStateChange();
    };

    /**
     *
     */
    ArDroneWifi.prototype.up = function () {
        if (this.isSimulated()) {
            console.log("ArDroneWifi.up");

        }
        else {
            this.drone.up(speed);
        }

        this.publishStateChange();
    };

    /**
     *
     */
    ArDroneWifi.prototype.down = function () {
        if (this.isSimulated()) {
            console.log("ArDroneWifi.down");

        }
        else {
            this.drone.down(speed)
        }

        this.publishStateChange();
    };

    /**
     *
     */
    ArDroneWifi.prototype.clockwise = function () {
        if (this.isSimulated()) {
            console.log("ArDroneWifi.clockwise");

        }
        else {
            this.drone.clockwise(speed)
        }

        this.publishStateChange();
    };

    /**
     *
     */
    ArDroneWifi.prototype.counterClockwise = function () {
        if (this.isSimulated()) {
            console.log("ArDroneWifi.counterClockwise");

        }
        else {
            this.drone.counterClockwise(speed)
        }

        this.publishStateChange();
    };

    /**
     *
     */
    ArDroneWifi.prototype.front = function () {
        if (this.isSimulated()) {
            console.log("ArDroneWifi.front");

        }
        else {
            this.drone.front(speed)
        }

        this.publishStateChange();
    };

    /**
     *
     */
    ArDroneWifi.prototype.back = function () {
        if (this.isSimulated()) {
            console.log("ArDroneWifi.back");

        }
        else {
            this.drone.back(speed)
        }

        this.publishStateChange();
    };

    /**
     *
     */
    ArDroneWifi.prototype.left = function () {
        if (this.isSimulated()) {
            console.log("ArDroneWifi.left");

        }
        else {
            this.drone.left(speed)
        }

        this.publishStateChange();
    };

    /**
     *
     */
    ArDroneWifi.prototype.right = function () {
        if (this.isSimulated()) {
            console.log("ArDroneWifi.right");

        }
        else {
            this.drone.right(speed)
        }

        this.publishStateChange();
    };
}
