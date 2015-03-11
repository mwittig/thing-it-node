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

var util = require("util");
var q = require("q");
var Emitter = require("events").EventEmitter;

// Serial Port Processing

var SLOTTO_BIT = 0xe0;

var infraredListener = function (data) {
    console.log("Data: " + data);

    if (data[0] == SLOTTO_BIT) {
        this.emit("ready");
    }
};

var Board;

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

                    self.enhanceBoard();

                    self.board = new Board();

                    console.log(self.board);

                    self.board.ready(function () {
                        console.log("Board ready");

                        self.sendCommand({sequence: [42, 77, 38, 6, 15]});

                        deferred.resolve();
                    });
                } catch (error) {
                    console.error(error);

                    self.device.node
                        .publishMessage("Cannot initialize "
                        + self.device.id + "/" + self.id
                        + ":" + error);
                }
            }).fail(function (error) {
                console.error(error);

                deferred.reject(error);
            });

        return deferred.promise;
    };

    /**
     * Add methode to the Board class
     */
    InfraredRemote.prototype.enhanceBoard = function () {
        if (this.isSimulated()) {
            var SerialPort = function () {
                Emitter.call(this);
            };

            util.inherits(SerialPort, Emitter);

            SerialPort.prototype.write = function (chunk) {
                console.log("Writing chunk: " + chunk);

                this.emit("data", SLOTTO_BIT);
            };

            Board = function () {
                Emitter.call(this);

                this.sp = new SerialPort();
            };

            util.inherits(Board, Emitter);

            Board.prototype.ready = function (callback) {
                callback();
            };
        }
        else {
            Board = require("firmadata").Board;
        }

        Board.prototype.sendInfraredCommand = function (command) {
            console.log("sendInfraredCommand");

            this.bindInfraredListener();

            console.log("Listener bound");

            var self = this;

            this.sendInfraredCommandSequenceRecursive(command.sequence, 0).then(function () {
                self.sendEpromToInfraredLed().then(function () {
                    self.unbindInfraredListener();
                }).fail(function () {
                    console.error(error);

                    self.unbindInfraredListener();

                    throw error;
                });
            }).fail(function (error) {
                console.error(error);

                self.unbindInfraredListener();

                throw error;
            });
        };

        Board.prototype.bindInfraredListener = function () {
            console.log("bindInfraredListener");
            console.log(this.sp.listeners);

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
            console.log("sendInfraredCommandSequenceRecursive " + index);

            var deferred = q.defer();

            if (index == sequence.length) {
                deferred.resolve();
            }
            else {
                var self = this;

                this.loadChunkToEprom(sequence[index]).then(function () {
                    console.log("Next round");
                    this.sendInfraredCommandSequenceRecursive(sequence, index + 1).then(function () {
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

            this.once("ready", function () {
                console.log("SP ready");
                deferred.resolve();
            });

            this.sp.write(chunk);

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

            this.once("ready", function () {
                deferred.resolve();
            });

            this.sp.write("Whatever you need to tell your sketch");

            return deferred.promise;
        };
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
        console.log("Send command");

        return this.board.sendInfraredCommand(command);
    };
}
;