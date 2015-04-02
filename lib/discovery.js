module.exports = {
    create: function (node, autoDiscoveryDeviceType) {
        var deviceType = node.plugins[autoDiscoveryDeviceType.plugin];
        var module = require(deviceType.modulePath);
        var discovery = module.discovery(autoDiscoveryDeviceType.options);

        utils.inheritMethods(discovery, new Discovery());

        discovery.deviceTypePlugin = autoDiscoveryDeviceType.plugin;
        discovery.confirmRegistration = autoDiscoveryDeviceType.confirmRegistration;
        discovery.persistRegistration = autoDiscoveryDeviceType.persistRegistration;
        discovery.deviceType = deviceType;
        discovery.node = node;

        return discovery;
    }
};

var utils = require("./utils");
var device = require("./device");

/**
 *
 * @constructor
 */
function Discovery() {
    /**
     *
     */
    Discovery.prototype.advertiseDevice = function (newDevice) {
        // TODO Check whether this device is already configured

        console.log("Advertise availability of device");

        // TODO Control centralized this functionality

        utils.inheritMethods(newDevice, device.create());

        newDevice.node = this.node;
        newDevice.__type = this.deviceType;

        var index = utils.getNextIdIndex(this.node.devices, this.deviceType.id, 1);

        newDevice.plugin = this.deviceTypePlugin;
        newDevice.id = this.deviceType.plugin + index;
        newDevice.label = this.deviceType.label + "" + index;

        if (this.confirmRegistration) {
            this.node.pendingDeviceRegistrations[newDevice.id] = newDevice;

            console.log("Advertising Device [" + newDevice.label + "].");
            console.log(this.node.id);

            this.node.publishDeviceAdvertisement(newDevice);
        }
        else {
            this.node.devices.push(newDevice);

            if (this.persistRegistration) {
                console.log("Persist Device Registration for Device [" + newDevice.label + "].");
            }
            else {
                newDevice.completeStart().then(function () {
                    this.node.publishDeviceRegistration(newDevice);
                }.bind(this)).fail(function (error) {
                }.bind(this));
            }

        }
    };
}