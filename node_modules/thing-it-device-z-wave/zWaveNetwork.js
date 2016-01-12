module.exports = {
    metadata: {
        family: 'z-wave',
        plugin: 'zWaveNetwork',
        label: 'Z-Wave Network',
        manufacturer: 'Z-Wave',
        discoverable: true,
        additionalSoftware: [{
            name: "Open Z-Wave",
            description: "Free software library that interfaces with selected Z-Wave PC controllers.",
            url: "https://github.com/OpenZWave/open-zwave",
            version: "v1.3"
        }],
        actorTypes: [],
        sensorTypes: [],
        services: [],
        configuration: [{
            id: 'usbDevice',
            label: 'USB Device',
            type: {
                id: 'string'
            }
        }]
    },
    create: function () {
        return new ZWaveNetwork();
    },
    discovery: function () {
        return new ZWaveNetworkDiscovery();
    }
};

var q = require('q');

/**
 *
 * @constructor
 */
function ZWaveNetworkDiscovery() {
    /**
     *
     * @param options
     */
    ZWaveNetworkDiscovery.prototype.start = function () {
        if (this.node.isSimulated()) {
            this.timer = setInterval(function () {
            }.bind(this), 20000);
        } else {
            if (!this.zWave) {
                var ZWave = require('openzwave-shared');

                this.zWave = new ZWave({
                    Logging: false,
                    ConsoleOutput: false
                });
            }

            this.zWave.on('driver ready', function (homeid) {
                this.logDebug('Scanning network with homeid 0x%s...', homeid.toString(16));

                this.currentHomeId = parseInt("0x" + homeid.toString(16));
            });

            this.zWave.on('driver failed', function () {
                this.logDebug('Failed to start driver.');

                this.zWave.disconnect();

                throw 'Cannot connect to driver.';
            });

            this.zWave.on('node ready', function (nodeid, nodeinfo) {
                this.logDebug('Node ready');
                this.logDebug('Manufacturer: ' + nodeinfo.manufacturer);
                this.logDebug('Product     : ' + nodeinfo.product);
                this.logDebug('Product Type: ' + nodeinfo.producttype);
                this.logDebug('Location    : ' + nodeinfo.loc);
            });

            this.zWave.on('node added', function (nodeid) {
                //this.logDebug('Node added: ' + nodeid);
                //
                //var zWaveNetwork = new ZWaveNetwork();
                //
                //zWaveNetwork.configuration = this.defaultConfiguration;
                //zWaveNetwork.configuration.homeId = this.currentHomeId;
                //zWaveNetwork.configuration.nodeId = nodeId;
                //
                //this.advertiseDevice(zWaveNetwork);
            });

            this.zWave.on('node ready', function (nodeid, nodeinfo) {
                this.logDebug('Node ready');
                this.logDebug('Manufacturer: ' + nodeinfo.manufacturer);
                this.logDebug('Product     : ' + nodeinfo.product);
                this.logDebug('Product Type: ' + nodeinfo.producttype);
                this.logDebug('Location    : ' + nodeinfo.loc);
            });

            this.zWave.connect('/dev/cu.SLAB_USBtoUART'); // TODO From Config

            // TODO For now, need to be able to switch for Discovery or inherit from Device

            this.logLevel = 'debug';
        }
    };

    /**
     *
     * @param options
     */
    ZWaveNetworkDiscovery.prototype.stop = function () {
        if (this.timer) {
            clearInterval(this.timer);
        }
    };
}

/**
 *
 * @constructor
 */
function ZWaveNetwork() {
    /**
     *
     */
    ZWaveNetwork.prototype.start = function () {
        var deferred = q.defer();

        if (this.isSimulated()) {
            deferred.resolve();
        } else {
            this.nodes = Array.apply(null, Array(256)).map(function () {
            });

            if (!this.zWave) {
                var ZWave = require('openzwave-shared');

                this.zWave = new ZWave({
                    Logging: false,
                    ConsoleOutput: false
                });
            }

            this.zWave.on('driver ready', function (homeid) {
                this.logDebug('Scanning network with homeid %s...', homeid.toString(16));
            }.bind(this));

            this.zWave.on('driver failed', function () {
                this.logDebug('Failed to start driver.');

                this.zWave.disconnect();

                throw 'Cannot connect to driver.';
            }.bind(this));

            this.zWave.on('node ready', function (nodeid, nodeinfo) {
                this.logDebug('Node ready  : ' + nodeid);
                this.logDebug('Manufacturer: ' + nodeinfo.manufacturer);
                this.logDebug('Product     : ' + nodeinfo.product);
                this.logDebug('Product Type: ' + nodeinfo.producttype);
                this.logDebug('Location    : ' + nodeinfo.loc);
                this.logDebug('Type        : ' + nodeinfo.type);
            }.bind(this));

            this.zWave.on('node added', function (nodeid) {
                this.logDebug('Node added: ' + nodeid);
            }.bind(this));

            this.zWave.on('node available', function (nodeid, nodeinfo) {
                if (!this.nodes[nodeid]) {
                    this.nodes[nodeid] = {};
                }

                this.nodes[nodeid].available = true;

                this.logDebug('Node available: ' + nodeid);
                this.logDebug('Manufacturer  : ' + nodeinfo.manufacturer);
                this.logDebug('Product       : ' + nodeinfo.product);
                this.logDebug('Product Type  : ' + nodeinfo.producttype);
                this.logDebug('Location      : ' + nodeinfo.loc);
                this.logDebug('Type          : ' + nodeinfo.type);
            }.bind(this));

            this.zWave.on('value added', function (nodeid, comclass, value) {
                if (this.nodes[nodeid] && this.nodes[nodeid].unit) {
                    this.nodes[nodeid].unit.setStateFromZWave(comclass, value);
                }
            }.bind(this));

            this.zWave.on('value changed', function (nodeid, comclass, value) {
                if (this.nodes[nodeid] && this.nodes[nodeid].unit) {
                    this.nodes[nodeid].unit.setStateFromZWave(comclass, value);
                }
            }.bind(this));

            this.zWave.connect('/dev/cu.SLAB_USBtoUART'); // TODO From Config

            deferred.resolve();
        }

        return deferred.promise;
    };

    /**
     *
     */
    ZWaveNetwork.prototype.stop = function () {
        var deferred = q.defer();

        if (this.isSimulated()) {
        } else {
            this.zWave.disconnect();
        }

        deferred.resolve();

        return deferred.promise;
    };

    /**
     *
     */
    ZWaveNetwork.prototype.getState = function () {
        return {};
    };

    /**
     *
     */
    ZWaveNetwork.prototype.setState = function () {
    };
}
