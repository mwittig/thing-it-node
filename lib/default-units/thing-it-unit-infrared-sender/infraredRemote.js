module.exports = {
    metadata: {
        plugin: "infraredRemote",
        role: "actor",
        label: "Infrared Remote",
        family: "light",
        virtual: true,
        deviceTypes: ["microcontroller/microcontroller"],
        configuration: [{
            label: "Pin",
            id: "pin",
            type: {
                family: "reference",
                id: "digitalInOutPin"
            },
            defaultValue: "12"
        }]
    },
    create: function () {
        return new InfraredRemote();
    }
};

var Board = require("firmadata").Board;
var q = require("q");

// Serial Port Processing

var SLOTTO_BIT = 0xe0;

var infraredListener = function (data) {
    if (data[0] == SLOTTO_BIT) {
        this.emit("ready");
    }
};

// Board enhancements

Board.prototype.sendInfraredCommand = function (commandSequence) {
    var deferred = q.defer();
    this.bindInfraredListener();

    var self = this;

    this.sendInfraredCommandSequenceRecursive(command.sequence, 0).then(function () {
        self.sendEpromToInfraredLed().then(function () {
            self.unbindInfraredListener();

            deferred.resolve();
        }).fail(function () {
            console.error(error);

            self.unbindInfraredListener();
            deferred.reject(error);
        });
    }).fail(function (error) {
        console.error(error);

        self.unbindInfraredListener();
        deferred.reject(error);
    });

    return deferred.promise;
};


Board.prototype.bindInfraredListener = function () {
    // Remove and store all existing event listeners on the Serial Port

    this.firmataListeners = this.sp.listeners("data");

    this.sp.removeAllListeners("data");

    // Register infrared listener

    this.on("data", infraredListener.bind(this));
};

Board.prototype.unbindInfraredListener = function () {
// Remove infrared listener

    this.sp.removeAllListeners("data");

// Add firmata listeners

    for (var n in this.firmataListeners) {
        this.sp.on("data", this.firmataListeners[n]);
    }
};

/**
 *
 * @param commandSequence
 * @param index
 * @returns {promise|*|d.promise|Q.promise|n.ready.promise}
 */
Board.prototype.sendInfraredCommandSequenceRecursive = function (sequence, index) {
    var deferred = q.defer();

    if (index == sequence.length) {
        deferred.resolve();
    }
    else {
        var self = this;

        this.loadChunkToEprom(sequence[index]).then(function () {
            this.sendInfraredCommandSequenceRecursive(sequence, ++index).then(function () {
                deferred.resolve();
            }).fail(function (error) {
                console.error(error);

                deferred.reject(error);
            }).fail(function () {
                console.error(error);

                deferred.reject(error);
            });
        });
    }

    return deferred.promise;
};

/**
 *
 * @param chunk
 * @param callback
 */
Board.prototype.loadChunkToEprom = function (chunk) {
    var deferred = q.defer();

    if (this.isSimulated()) {
        console.log("Writing sequence chunk " + chunk);
    }
    else {
        this.once("ready", function () {
            deferred.resolve();
        });


        this.sp.write(chunk);
    }

    return deferred.promise;
};

/**
 *
 * @param commandSequence
 * @param index
 * @returns {promise|*|d.promise|Q.promise|n.ready.promise}
 */
Board.prototype.sendEpromToInfraredLed = function (commandSequence, index) {
    var deferred = q.defer();

    if (this.isSimulated()) {
        console.log("Writing memory to LED");
    }
    else {
        this.once("ready", function () {
            deferred.resolve();
        });

        this.sp.write("Whatever you need to tell your sketch");
    }

    return deferred.promise;
};

/**
 *
 */
function InfraredRemote() {
    /**
     *
     */
    InfraredRemote.prototype.start = function () {
        var deferred = q.defer();

        this.state = {};

        var self = this;

        this.startActor().then(
            function () {
                try {
                    self.initializeState();

                    self.board = new Board();

                    self.board.prototype.isSimulated = function () {
                        return self.isSimulated();
                    };

                    self.board.ready(function () {
                        deferred.resolve();
                    });
                } catch (x) {
                    self.device.node
                        .publishMessage("Cannot initialize "
                        + self.device.id + "/" + self.id
                        + ":" + x);
                }
            }).fail(function (error) {
                deferred.reject(error);
            });

        return deferred.promise;
    };

    /**
     *
     */
    InfraredRemote.prototype.getState = function () {
        return this.state;
    };

    /**
     *
     */
    InfraredRemote.prototype.setState = function (state) {
        this.state = state;
    };

    /**
     *
     */
    InfraredRemote.prototype.sendCommand = function (command) {
        return board.sendInfraredCommand(command);
    };
}
;