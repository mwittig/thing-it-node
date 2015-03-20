module.exports = {
    metadata: {
        plugin: "radioRemote",
        role: "actor",
        label: "Radio Remote",
        family: "light",
        virtual: true,
        deviceTypes: ["microcontroller/microcontroller"],
        configuration: []
    },
    create: function () {
        return new RadioRemote();
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

var radioListener = function (data) {

    if (data[0] == THING_IT_DATA_RECIEVED) { //TODO implement sysex structur

        this.emit("ready");
    }
};


var Board;

/**
 *
 */
function RadioRemote() {
    /**
     *
     */
    RadioRemote.prototype.start = function () {
        var deferred = q.defer();

        this.state = {};

        try {
            this.initializeState();
            this.enhanceBoard();

            deferred.resolve();
        } catch (error) {
            console.error(error);

            this.device.node
                .publishMessage("Cannot initialize "
                + this.device.id + "/" + this.id
                + ":" + error);

            deferred.reject();
        }

        return deferred.promise;
    };

    /**
     * Add methode to the Board class
     */
    RadioRemote.prototype.enhanceBoard = function () {
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

        this.board.sendRadioCommand = function (command) {
            var deferred = q.defer();

            try {
                this.bindRadioListener();

                var self = this;

                var calculatedCommandset = [];

                var tmp = 0;

                for (var n = 0; n < command.system_code.length; n++) {

                    tmp = tmp << 1 | command.system_code[n].valueOf();

                }

                for (var i = 0; i < command.unit_code.length; i++) {

                    tmp = tmp << 1 | command.unit_code[i].valueOf();

                }

                for (var j = 0; j < command.mode.length; j++) {

                    tmp = tmp << 1 | command.mode[j].valueOf();

                }

                calculatedCommandset.push(command.pin.valueOf());
                calculatedCommandset.push(tmp);


                this.sendRadioCommandSequenceRecursive(calculatedCommandset, 0).then(function () {
                    self.sendBufferToRadioModule().then(function () {
                        self.unbindRadioListener();

                        deferred.resolve();
                    }).fail(function () {
                        console.error(error);

                        self.unbindRadioListener();

                        deferred.reject(error);
                    });
                }).fail(function (error) {
                    console.error(error);

                    self.unbindRadioListener();

                    deferred.reject(error);
                });
            } catch (error) {
                deferred.reject(error);
            }


            return deferred.promise;
        };

        this.board.bindRadioListener = function () {
            // Remove and store all existing event listeners on the Serial Port

            this.firmataListeners = this.sp.listeners("data");

            this.sp.removeAllListeners("data");

            // Register radio listener

            this.sp.on("data", radioListener.bind(this));
        };

        this.board.unbindRadioListener = function () {
            // Remove radio listener

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
        this.board.sendRadioCommandSequenceRecursive = function (sequence, index) {
            var deferred = q.defer();

            if (index == sequence.length) {
                deferred.resolve();
            }
            else {
                var self = this;

                this.loadChunkToBuffer(sequence[index], index).then(function () {
                    self.sendRadioCommandSequenceRecursive(sequence, index + 1).then(function () {
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
        this.board.sendBufferToRadioModule = function (commandSequence, index) {
            var deferred = q.defer();

            this.once("ready", function () {
                deferred.resolve();
            });

            try {

                var data = [
                    START_SYSEX,
                    THING_IT_FIRMATA,
                    0x03,    // Flush to Radio
                    END_SYSEX
                ];

                this.sp.write(data);
                console.log("Flushed to RadioModule: " + data);
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
    RadioRemote.prototype.getState = function () {
        return this.state;
    };

    /**
     *
     */
    RadioRemote.prototype.setState = function (state) {
        this.state = state;
    };

    /**
     *
     */
    RadioRemote.prototype.sendCommand = function (command) {
        return this.board.sendRadioCommand(command);
    };
}
