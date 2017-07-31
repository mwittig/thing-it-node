module.exports = {
    create: function (bootDir, configDir) {
        return new ConfigurationManager().initialize(bootDir, configDir);
    }
};

var bleno = require('bleno');
var util = require('util');
var fs = require('fs');

function ConfigurationManager() {
}

ConfigurationManager.prototype.initialize = function (bootDir, configDir, rebootCmd) {
    this.bootDir = bootDir;
    this.configDir = configDir;
    this.rebootCmd = rebootCmd;

    console.log('\nBoot Directory: ' + this.bootDir);
    console.log('Configuration Directory: ' + this.configDir);

    return this;
}

ConfigurationManager.prototype.listen = function () {
    var PrimaryService = bleno.PrimaryService;
    var Characteristic = bleno.Characteristic;

    console.log('\nStarting Bluetooth.');

    var SERVICE_UUID = 'fe88997215254b9e96d41a84bcb4cca4';
    var CHARACTERISTIC_UUID = '8ddf954bc0d3404bad48fdab8523aea6';

    bleno.on('stateChange', function (state) {
        if (state === 'poweredOn') {
            bleno.startAdvertising('Advertising Configuration Peripheral for [thing-it-node] Gateway', [SERVICE_UUID]);
        } else {
            bleno.stopAdvertising();
        }
    });

    bleno.on('advertisingStart', function (error) {
        console.log('Started to advertise Configuration Peripheral for [thing-it-node] Gateway');

        if (!error) {
            bleno.setServices([
                new PrimaryService({
                    uuid: SERVICE_UUID,
                    characteristics: [
                        new Characteristic({
                            uuid: CHARACTERISTIC_UUID,
                            properties: ['read', 'write', 'notify'],
                            value: null,
                            onReadRequest: null,
                            onWriteRequest: function (data, offset, withoutResponse, callback) {
                                var configuration = JSON.parse(data.toString('utf-8'));

                                console.log('Configuration: ', configuration);

                                this.applyConfiguration(configuration);

                                callback(Characteristic.RESULT_SUCCESS);
                            }.bind(this),
                            onSubscribe: null,
                            onUnsubscribe: null,
                            onNotify: null,
                            onIndicate: null

                        })]
                })
            ]);
        }
    }.bind(this));
};

ConfigurationManager.prototype.applyConfiguration = function (configuration) {
    var defaultConfiguration = {
        label: 'Default',
        id: 'default',
        autoDiscoveryDeviceTypes: [],
        devices: [],
        services: [],
        eventProcessors: []
    };

    var defaultOptions = {
        "port": 3001,
        "protocol": "http",
        "nodeConfigurationsDirectory": "/Users/marcgille/git/tatcraft/cncMachine/configurations",
        "dataDirectory": "/Users/marcgille/git/tatcraft/cncMachin/data",
        "usersDirectory": "/Users/marcgille/git/tatcraft/cncMachine/users",
        "simulated": false,
        "authentication": "none",
        "logLevel": "debug",
        "proxy": "https://www.thing-it.com"
    };

    // Add configuration values

    defaultOptions.uuid = configuration.gatewayComputerUuid;
    defaultConfiguration.uuid = configuration.gatewayConfigurationUuid;
    defaultConfiguration.mesh = configuration.meshUuid;
    defaultConfiguration.customer = configuration.customerUuid;

    // Write wpa_supplicant.conf file

    var path = this.bootDir + '/wpa_supplicant.conf';
    var content = 'network={\n' +
        '\tssid="' + configuration.ssid + '"\n' +
        '\tpsk="' + configuration.password + '"\n' +
        '\tkey_mgmt=WPA-PSK\n' +
        '}';

    console.log('Writing WPK Support File to ' + path);

    fs
        .writeFileSync(path, content);

    // Write options file

    var path = this.configDir + '/options.js';

    console.log('Writing options to ' + path);

    fs
        .writeFileSync(path, 'module.exports = ' + JSON.stringify(defaultOptions, null, 3) + ';');

    // Write default configuration

    var path = this.configDir + '/configurations/default.js';

    console.log('Writing default configuration to ' + path);

    fs
        .writeFileSync(path, 'module.exports = ' + JSON.stringify(defaultConfiguration, null, 3) + ';');

    // Restart Gateway Computer

    if (this.rebootCmd) {
        require('child_process').exec(this.rebootCmd, function (error) {
            console.log('Failed to restart Gateway Computer: ' + error);
        });
    }
};

