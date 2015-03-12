module.exports = {
    metadata: {
        plugin: "infraredRemote",
        role: "actor",
        label: "Infrared Remote",
        family: "light",
        virtual: true,
        deviceTypes: ["microcontroller/microcontroller"],
        configuration: []
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

                    deferred.resolve();
                } catch (error) {
                    console.error(error);

                    self.device.node
                        .publishMessage("Cannot initialize "
                        + self.device.id + "/" + self.id
                        + ":" + error);

                    deferred.reject();
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
                console.log("Write chunk: " + chunk);

                this.emit("data", [SLOTTO_BIT]);
            };

            Board = function () {
                Emitter.call(this);

                this.sp = new SerialPort();
            };

            util.inherits(Board, Emitter);

            Board.prototype.ready = function (callback) {
                callback();
            };

            this.board = new Board();
        }
        else {
            this.board = this.device.board.io;
        }

        this.board.sendInfraredCommand = function (command) {
            var deferred = q.defer();

            try {
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
            } catch (error) {
                deferred.reject(error);
            }


            return deferred.promise;
        };

        this.board.bindInfraredListener = function () {
            // Remove and store all existing event listeners on the Serial Port

            this.firmataListeners = this.sp.listeners("data");

            this.sp.removeAllListeners("data");

            // Register infrared listener

            this.sp.on("data", infraredListener.bind(this));
        };

        this.board.unbindInfraredListener = function () {
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
        this.board.sendInfraredCommandSequenceRecursive = function (sequence, index) {
            var deferred = q.defer();

            if (index == sequence.length) {
                deferred.resolve();
            }
            else {
                var self = this;

                this.loadChunkToEprom(sequence[index]).then(function () {
                    self.sendInfraredCommandSequenceRecursive(sequence, index + 1).then(function () {
                        deferred.resolve();
                    }).fail(function (error) {
                        console.error(error);

                        deferred.reject(error);
                    });
                }).fail(function (error) {
                    console.error(error);

                    deferred.reject(error);
                });
            }

            return deferred.promise;
        };

        /**
         *
         * @param chunk
         * @param callback
         */
        this.board.loadChunkToEprom = function (chunk) {
            var deferred = q.defer();

            this.once("ready", function () {
                deferred.resolve();
            });

            try {
                console.log("Writing " + chunk);
                this.sp.write(chunk);
                console.log("Written " + chunk);
            }
            catch (error) {
                console.error("Cannot write to serial port.");

                deferred.reject(error);
            }

            return deferred.promise;
        };

        /**
         *
         * @param commandSequence
         * @param index
         * @returns {promise|*|d.promise|Q.promise|n.ready.promise}
         */
        this.board.sendEpromToInfraredLed = function (commandSequence, index) {
            var deferred = q.defer();

            this.once("ready", function () {
                deferred.resolve();
            });

            try {
                console.log("Flushing to IR");
                this.sp.write("FLUSH BUFFER TO IR LED");
                console.log("Flushed to IR");
            }
            catch (error) {
                console.error("Cannot write to serial port.");
            }

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
        return this.board.sendInfraredCommand(command);
    };
}
