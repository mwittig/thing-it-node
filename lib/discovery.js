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
        for (var n in this.node.devices) {
            if (newDevice.uuid === this.node.devices[n].uuid &&
                this.deviceTypePlugin === this.node.devices[n].plugin) {

                console.log("\tRejecting discovered Device " + newDevice.uuid + " (" + newDevice.plugin + ") as it is already registered/configured.");

                return;
            }
        }

        console.log("Advertise availability of device");

        // TODO Control centralized this functionality

        utils.inheritMethods(newDevice, device.create());

        newDevice.node = this.node;
        newDevice.__type = this.deviceType;
        newDevice.plugin = this.deviceTypePlugin;
        newDevice.label = this.deviceType.label + " (" + newDevice.uuid + ")";

        if (this.confirmRegistration) {
            this.node.pendingDeviceRegistrations[newDevice.uuid] = newDevice;

            console.log("\tAdvertising Device [" + newDevice.label + "].");

            this.node.publishDeviceAdvertisement(newDevice);
        }
        else {
            var index = utils.getNextIdIndex(this.node.devices, this.deviceType.id, 1);

            newDevice.id = this.deviceType.plugin + index;
            newDevice.label = this.deviceType.label + " " + index;

            this.node.devices.push(newDevice);

            if (this.persistRegistration) {
                console.log("Persist Device Registration for Device [" + newDevice.label + "].");
            }
            else {
                newDevice.start().then(function () {
                    this.node.publishDeviceRegistration(newDevice);
                }.bind(this)).fail(function (error) {
                }.bind(this));
            }
        }
    };
}