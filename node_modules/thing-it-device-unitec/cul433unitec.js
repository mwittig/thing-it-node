/**
 * Created by backes on 11/8/15.
 */

module.exports = {
    metadata: {
        family: "cul",
        plugin: "cul433unitec",
        label: "CUL 433 MHz transceiver switching Unitec remote control sockets",
        tangible: true,
        actorTypes: [],
        sensorTypes: [],
        state : [{
            id: "switch",
            label : "SwitchState",
            type : {
                id : "boolean"
            }
        }],
        services: [{
            id: "switchOn",
            label: "Switch Socket to state On"
        },
        {
            id: "switchOff",
            label: "Switch Socket to state Off"
        }],
        configuration: [{
            id: "home_id",
            label: "Home ID",
            type: { id: "string"},
            default: "FFFF"},
            {
                id: "socket_id",
                label: "Socket ID",
                type: {id: "string"},
                default: "00F"}]
    },
    create: function (device) {
        return new Cul433Unitec();
    }
};

var q = require('q');

var Cul = require('cul');


/*
 Inside a UniTec socket you find 10 dip switches for setting the code.
 If a switch is set, it is coded with a '0'. If it is not set, it will be represented by a 'F'.
 For turning on the sequence '0F' and for turning off 'F0' has to be appended to the code.
 */

var localconf = {
    on : "0F",
    off : "F0",
    send_intertechno : "is"
}

function Cul433Unitec() {
    /**
     *
     */
    Cul433Unitec.prototype.start = function () {
        var deferred = q.defer();

        this.state = { switch: false};

        if (this.isSimulated()) {
            deferred.resolve();
        } else {
            this.cul = new Cul({
                serialport: '/dev/ttyUSB0',
                mode: 'SlowRF',
                baudrate: '38400'
            });

            // ready event is emitted after serial connection is established and culfw acknowledged data reporting
            this.cul.on('ready', function () {
                // send commands to culfw
                this.cul.write('V');
            }.bind(this));

            this.cul.on('data', function(raw) {
                console.log(raw);
                this.publishStateChange();
            })

            deferred.resolve();
        }
        return deferred.promise;
    };
    /**
     *
     */
    Cul433Unitec.prototype.setState = function (state) {
        this.state = state;
    };
    /**
     *
     */
    Cul433Unitec.prototype.getState = function () {
        return this.state;
    };
    /**
     *
     */
    Cul433Unitec.prototype.switchOn = function () {
        if (this.isSimulated()) {
            console.log("Cul433Unitec.switchOn");
        }
        else {
            this.cul.write(localconf.send_intertechno + this.configuration.home_id + this.configuration.socket_id + localconf.on);
            this.state.switch = { switch : true};
        }
        this.publishStateChange();
    };
    /**
     *
     */
    Cul433Unitec.prototype.switchOff = function () {
        if (this.isSimulated()) {
            console.log("Cul433Unitec.switchOff");
        }
        else {
            this.cul.write(localconf.send_intertechno + this.configuration.home_id + this.configuration.socket_id + localconf.off);
            this.state.switch = { switch : false};
        }
        this.publishStateChange();
    };
}

