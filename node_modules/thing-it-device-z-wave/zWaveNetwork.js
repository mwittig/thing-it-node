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
        configuration: []
    },
    create: function () {
        return new ZWaveNetwork();
    },
    discovery: function () {
        return new ZWaveNetworkDiscovery();
    }
};

var os = require('os');
var q = require('q');
var _ = require('lodash');

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

            this.nodes = [];

            this.zWave.on('driver ready', function (homeid) {
                this.logDebug('Scanning network with homeid 0x%s...', homeid.toString(16));

                this.currentHomeId = parseInt("0x" + homeid.toString(16));

                // Wait 20 seconds to collect all nodes and create Device/Actor structure
                // TODO Make timeout configurable

                this.timer = setTimeout(function () {
                    // Add the Z-Wave Network Device

                    var zWaveNetwork = new ZWaveNetwork();

                    if (this.defaultConfiguration) {
                        zWaveNetwork.configuration = _.cloneDeep(this.defaultConfiguration);
                    } else {
                        zWaveNetwork.configuration = {};
                    }

                    zWaveNetwork.id = this.currentHomeId;
                    zWaveNetwork.uuid = this.currentHomeId;
                    zWaveNetwork.label = "Z-Wave Network " + this.currentHomeId;
                    zWaveNetwork.configuration.homeId = this.currentHomeId;
                    zWaveNetwork.configuration.nodeId = 1;
                    zWaveNetwork.actors = [];

                    // Add all ready Nodes depending on their types
                    // TODO Add all remaining device classes

                    for (n in this.nodes) {
                        this.logDebug("++++++++ ", this.nodes[n].type);

                        var actor;

                        if (this.nodes[n].type === 'Binary Power Switch') {
                            this.logDebug("Adding Binary Power Switch", this.nodes[n]);

                            zWaveNetwork.actors.push(actor = {
                                id: "binaryPowerSwitch" + n,
                                label: "Binary Power Switch " + n,
                                type: "binaryPowerSwitch",
                                configuration: {
                                    nodeId: n
                                }
                            });
                        }
                        else if (this.nodes[n].type === 'Routing Multilevel Sensor') {
                            this.logDebug("Adding Routing Multilevel Sensor", this.nodes[n]);

                            zWaveNetwork.actors.push(actor = {
                                id: "multilevelSensor" + n,
                                label: "Multilevel Sensor " + n,
                                type: "multilevelSensor",
                                configuration: {
                                    nodeId: n
                                }
                            });
                        }
                    }

                    this.advertiseDevice(zWaveNetwork);
                }.bind(this), 20000);
            }.bind(this));

            this.zWave.on('driver failed', function () {
                this.logDebug('Failed to start driver.');

                this.zWave.disconnect();

                throw 'Cannot connect to driver.';
            }.bind(this));

            this.zWave.on('node ready', function (nodeId, nodeInfo) {
                this.logDebug('Node ready');
                this.logDebug('ID          : ' + nodeId);
                this.logDebug('Type        : ' + nodeInfo.type);
                this.logDebug('Manufacturer: ' + nodeInfo.manufacturer);
                this.logDebug('Product     : ' + nodeInfo.product);
                this.logDebug('Product Type: ' + nodeInfo.producttype);
                this.logDebug('Location    : ' + nodeInfo.loc);

                this.nodes[nodeId] = {
                    manufacturer: nodeInfo.manufacturer,
                    manufacturerid: nodeInfo.manufacturerid,
                    product: nodeInfo.product,
                    producttype: nodeInfo.producttype,
                    productid: nodeInfo.productid,
                    type: nodeInfo.type,
                    name: nodeInfo.name,
                    loc: nodeInfo.loc,
                    ready: true
                };
            }.bind(this));

            this.zWave.on('node added', function (nodeid) {
                this.logDebug('Node added: ' + nodeid);
            }.bind(this));

            this.zWave.connect(getDriverPath());

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

            this.zWave.connect(getDriverPath());

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

var driverPaths = {
    "darwin" : '/dev/cu.SLAB_USBtoUART',
    "linux"  : '/dev/ttyUSB0',
    "windows": '\\\\.\\COM3'
}

/**
 *
 * @returns {*}
 */
function getDriverPath() {
    return driverPaths[os.platform()];
}
