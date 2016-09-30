module.exports = {
    metadata: {
        family: 'chp',
        plugin: 'chp',
        label: 'Generic Combined Heat and Power Unit',
        manufacturer: 'Generic',
        discoverable: false,
        tangible: true,
        additionalSoftware: [],
        actorTypes: [],
        sensorTypes: [],
        state: [{
            id: "power",
            label: "Power",
            type: {
                id: "decimal"
            }
        }, {
            id: "drive",
            label: "Drive",
            type: {
                id: "decimal"
            }
        }, {
            id: "gasConsumption",
            label: "Gas Consumption",
            type: {
                id: "decimal"
            }
        }, {
            id: "exhaustTemperature",
            label: "Exhaust Temperature",
            type: {
                id: "decimal"
            }
        }],
        services: [{
            id: "activate", label: "Activate", parameters: []
        },
            {
                id: "shutdown", label: "Shutdown", parameters: []
            },
            {
                id: "increaseGasConsumption", label: "Increase Gas Consumption", parameters: []
            },
            {
                id: "decreaseGasConsumption", label: "Decrease Gas Consumption", parameters: []
            }],
        configuration: []
    },
    create: function () {
        return new Chp();
    },
    discovery: function () {
        return new ChpDiscovery();
    }
};

var q = require('q');
var _ = require('lodash');

function ChpDiscovery() {
    ChpDiscovery.prototype.start = function () {

        if (!this.node.isSimulated()) {
            // TODO For now, need to be able to switch for Discovery or inherit from Device
            this.logLevel = "debug";
            this.scanForCameras();
            this.discoveryInterval = setInterval(this.scanForProbe.bind(this), 30000);
        }
    };

    ChpDiscovery.prototype.stop = function () {
        if (discoveryInterval !== undefined && discoveryInterval) {
            clearInterval(discoveryInterval);
        }
    };

    ChpDiscovery.prototype.scanForProbe = function () {
    };
}

/**
 *
 * @constructor
 */
function Chp() {
    Chp.prototype.start = function () {
        var deferred = q.defer();

        this.state = {};

        this.state.power = 0;
        this.state.gasConsumption = 0;
        this.state.drive = 0;
        this.state.heatOutput = 0;
        this.state.exhaustTemperature = 0;
        this.state.coolingWaterTemperature = 0;

        if (this.isSimulated()) {
            this.__lastDrive = 0;
            this.__lastPower = 0;
            this.__lastExhaustTemperature = 20;

            this.statusChangeInterval = setInterval(function () {
                if (new Date().getTime() % 2) {
                    this.publishEvent('6.1', {details: 'Lubricant empty'});
                }
            }.bind(this), 20000);

            deferred.resolve();
        } else {

            deferred.resolve();
        }

        return deferred.promise;
    };

    /**
     *
     */
    Chp.prototype.stop = function () {
        var deferred = q.defer();

        if (this.isSimulated()) {
            if (this.interval) {
                clearInterval(this.interval);
            }
            else if (this.statusChangeInterval) {
                clearInterval(this.statusChangeInterval);
            }
        } else {
        }

        deferred.resolve();

        return deferred.promise;
    };

    /**
     *
     */
    Chp.prototype.shutdown = function () {
        this.state.running = false;
        this.state.gasConsumption = 0;
        this.state.power = 0;
        this.state.idlePower = 0;

        this.publishStateChange();
    };

    /**
     *
     */
    Chp.prototype.activate = function () {
        this.state.running = true;
        this.state.exhaustTemperature = 20;
        this.state.power = 0;
        this.state.idlePower = 0;

        this.setState({gasConsumption: 10});
        this.publishStateChange();
    };

    /**
     *
     */
    Chp.prototype.getState = function () {
        return this.state;
    };

    /**
     *
     */
    Chp.prototype.setState = function (state) {
        // Only allow changes of gas consumption

        this.logDebug('Set State', state);

        if (state.gasConsumption) {
            if (this.__timeout) {
                return;
            }

            this.__timeout = setTimeout(function () {
                // Do not allow gas consumption above 100 or below 0

                state.gasConsumption = Math.max(0, state.gasConsumption, Math.min(100, state.gasConsumption));

                this.logDebug('Set Gas Consumption: ', state.gasConsumption);

                // Changes under 0.1% are not applied

                if ((state.gasConsumption == 0 && this.state.gasConsumption == 0 ) ||
                    0.001 > Math.abs((this.state.gasConsumption - state.gasConsumption) / Math.max(this.state.gasConsumption, state.gasConsumption))) {

                    this.__timeout = null;
                } else {
                    this.state.gasConsumption = state.gasConsumption;

                    this.state.drive += 100 * state.gasConsumption - 0.1 * this.__lastDrive;
                    this.state.power += 30 * state.gasConsumption - 0.2 * this.__lastPower;
                    this.state.exhaustTemperature += 1.8 * state.gasConsumption - 0.3 * this.__lastExhaustTemperature;

                    this.logDebug('Set Drive: ', this.state.drive);
                    this.logDebug('Set Power: ', this.state.power);
                    this.logDebug('Set Power: ', this.state.exhaustTemperature);

                    this.__lastDrive = this.state.drive;
                    this.__lastPower = this.state.power;
                    this.__lastExhaustTemperature = this.state.exhaustTemperature;
                    this.__timeout = null;

                    this.publishStateChange();
                }
            }.bind(this), 1000);
        }
    };

    /**
     *
     */
    Chp.prototype.increaseGasConsumption = function () {
        this.setState({gasConsumption: this.state.gasConsumption + 10});
    };

    /**
     *
     */
    Chp.prototype.decreaseGasConsumption = function () {
        this.setState({gasConsumption: Math.max(0, this.state.gasConsumption - 10)});
    };
}

