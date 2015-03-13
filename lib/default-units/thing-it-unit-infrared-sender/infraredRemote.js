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


var START_SYSEX = 0xF0,
    THING_IT_FIRMATA = 0x0F,
    THING_IT_DATA_RECIEVED = 0x1F,
    END_SYSEX = 0xF7;

// Serial Port Processing

var infraredListener = function (data) {

    if (data[0] == THING_IT_DATA_RECIEVED) { //TODO implement sysex structur

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

                this.emit("data", [THING_IT_DATA_RECIEVED]);
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

                var calculatedCommandset = [];

                calculatedCommandset.push(command.frequency.valueOf());

                for (var n = 0; n < command.sequence.length; n++) {
                    calculatedCommandset.push(Math.round(parseFloat(command.sequence[n].valueOf() / (command.frequency / 1000) * 1000)));
                }


                this.sendInfraredCommandSequenceRecursive(calculatedCommandset, 0).then(function () {
                    self.sendBufferToInfraredLed().then(function () {
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

                this.loadChunkToBuffer(sequence[index], index).then(function () {
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
        this.board.loadChunkToBuffer = function (chunk, index) {
            var deferred = q.defer();

            this.once("ready", function () {
                deferred.resolve();
            });

            try {
                var data = [
                    START_SYSEX,
                    THING_IT_FIRMATA,
                    0x01    // Push to Arduino Buffer
                ];


                data.push(index);
                data.push(chunk & 0xFF);
                data.push((chunk >> 8) & 0xFF);
                data.push(END_SYSEX);

                //console.log("Writing " + chunk, " ");
                this.sp.write(data);
                //console.log("Written " + data);
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
        this.board.sendBufferToInfraredLed = function (commandSequence, index) {
            var deferred = q.defer();

            this.once("ready", function () {
                deferred.resolve();
            });

            try {
                console.log("Flushing to IR");
                var data = [
                    START_SYSEX,
                    THING_IT_FIRMATA,
                    0x02,    // Flush to IR LED
                    END_SYSEX
                ];

                this.sp.write(data);
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
