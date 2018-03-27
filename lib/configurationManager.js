module.exports = {
    create: function (bootDir, configDir, rebootCmd) {
        return new ConfigurationManager().initialize(bootDir, configDir, rebootCmd);
    }
};

var bleno;
var fs = require('fs');

function ConfigurationManager() {
}

ConfigurationManager.prototype.initialize = function (bootDir, configDir, rebootCmd) {
    this.bootDir = bootDir;
    this.configDir = configDir;
    this.rebootCmd = rebootCmd;

    console.log('\nBoot Directory: ' + this.bootDir);
    console.log('Configuration Directory: ' + this.configDir);
    console.log('Reboot Cmd: ' + this.rebootCmd);

    return this;
}

ConfigurationManager.prototype.listen = function () {
    bleno = require('bleno');
    var PrimaryService = bleno.PrimaryService;
    var Characteristic = bleno.Characteristic;

    console.log('\nStarting Bluetooth.');

    var SERVICE_UUID = 'fe88997215254b9e96d41a84bcb4cca4';
    var CHARACTERISTIC_UUID = '8ddf954bc0d3404bad48fdab8523aea6';


    bleno.on('stateChange', function (state) {
        if (state === 'poweredOn') {
            bleno.startAdvertising('Advertising for TIN', [SERVICE_UUID]);
        } else {
            bleno.stopAdvertising();
        }
    });

    bleno.on('advertisingStart', function (error) {
        console.log('Started to advertise Peripheral for TIN');

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
        } else {
            console.error(error);
        }

    }.bind(this));
};

ConfigurationManager.prototype.applyConfiguration = function (configuration) {

    var defaultConfigurationJSON = fs.readFileSync(this.configDir + "/configurations/default.js", 'utf8');

    defaultConfigurationJSON = defaultConfigurationJSON
        .substring(defaultConfigurationJSON
            .indexOf("{") - 1, defaultConfigurationJSON
            .lastIndexOf(";"));

    var defaultConfiguration = JSON.parse(defaultConfigurationJSON);

    console.log("Configuration:" + JSON.stringify(defaultConfiguration));

    var defaultOptions = require(this.configDir + "/options.js");
    console.log("Options:" + JSON.stringify(defaultOptions));

    // Add configuration values

    defaultOptions.uuid = configuration.gatewayComputerUuid;

    //Avoid starting BTLE configuration a second time
    defaultOptions.noBtleConfiguration = true;

    defaultConfiguration.uuid = configuration.gatewayConfigurationUuid;
    defaultConfiguration.mesh = configuration.meshUuid;
    defaultConfiguration.customer = configuration.customerUuid;

    // Write wpa_supplicant.conf file

    if (this.bootDir) {
        var path = this.bootDir + '/wpa_supplicant.conf';
        var content = 'ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev\n' +
            'update_config=1\n' +
            'country=DE\n\n' +
            'network={\n' +
            '\tssid="' + configuration.ssid + '"\n' +
            '\tpsk="' + configuration.password + '"\n' +
            '\tkey_mgmt=WPA-PSK\n' +
            '}';

        // TODO: [TI-361] support EAP-TLS configuration

        // TODO: Certificates should be pre-installed (image) or pushed via bluetooth (secure?)

        // network={
        //  …
        //  key_mgmt=WPA-EAP
        //     eap=PEAP
        //     identity="<em>user@example.com</em>"
        //     password="<em>password</em>"
        //     ca_cert="/etc/cert/ca.pem"
        //     phase2="auth=MSCHAPV2"
        // }

        console.log('Writing WPK Support File to ' + path);

        fs.writeFileSync(path, content);
    }

    // Write options file
    var path = this.configDir + '/options.js';
    console.log('Writing options to ' + path);
    fs.writeFileSync(path, 'module.exports = ' + JSON.stringify(defaultOptions, null, 3) + ';');

    // Write default configuration
    var path = this.configDir + '/configurations/default.js';
    console.log('Writing default configuration to ' + path);
    fs.writeFileSync(path, 'module.exports = ' + JSON.stringify(defaultConfiguration, null, 3) + ';');

    // Restart Gateway Computer

    if (this.rebootCmd) {

        console.log("Executing: " + this.rebootCmd);

        require('child_process').exec(this.rebootCmd, function (error) {
            console.log('Failed to restart Gateway Computer: ' + error);
        });
    }
};
