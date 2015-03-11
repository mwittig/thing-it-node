module.exports = {
    metadata: {
        family: "ardrone",
        plugin: "ardrone",
        label: "ArDrone Device",
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
        return new ArDrone();
    }
};

var utils = require("../../utils");
var q = require('q');
var arDrone = require('ar-drone');

/**
 *
 */
function ArDrone() {
    /**
     *
     */
    ArDrone.prototype.start = function () {
        var deferred = q.defer();
        var self = this;

        this.state = {
            longitude: 0,
            latitude: 0,
            height: 0
        };

        self.startDevice().then(function () {
            if (self.isSimulated()) {
                deferred.resolve();
            } else {
                //var client = arDrone.createClient();
                //
                //client.takeoff();
                //client
                //    .after(5000, function () {
                //        this.clockwise(0.5);
                //    })
                //    .after(3000, function () {
                //        this.stop();
                //        this.land();
                //    });
                //
                //console.log("ArDrone started.");

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
    ArDrone.prototype.setState = function (state) {
        this.state = state;
    };

    /**
     *
     */
    ArDrone.prototype.getState = function () {
        return this.state;
    };

    /**
     *
     */
    ArDrone.prototype.takeOff = function () {
        console.log("ArDrone.takeOff");

        this.publishStateChange();
    };

    /**
     *
     */
    ArDrone.prototype.land = function () {
        console.log("ArDrone.land");

        this.publishStateChange();
    };

    /**
     *
     */
    ArDrone.prototype.turnClockwise = function () {
        console.log("ArDrone.turnClockwise");

        this.publishStateChange();
    };
}
