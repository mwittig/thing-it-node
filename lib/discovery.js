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

        if (autoDiscoveryDeviceType.defaultConfiguration) {
            discovery.defaultConfiguration = autoDiscoveryDeviceType.defaultConfiguration;
        }
        else {
            discovery.defaultConfiguration = {};
        }

        discovery.node = node;

        return discovery;
    }
};

var utils = require("./utils");
var device = require("./device");
var logger = require("./logger");

/**
 *
 * @constructor
 */
function Discovery() {
    this.class = "Discovery";

    utils.inheritMethods(this, logger.create());

    /**
     *
     */
    Discovery.prototype.advertiseDevice = function (newDevice) {
        for (var n in this.node.devices) {
            if (newDevice.uuid === this.node.devices[n].uuid &&
                this.deviceTypePlugin === this.node.devices[n].plugin) {

                this.logDebug("\tRejecting discovered Device " + newDevice.uuid + " (" + this.deviceTypePlugin + ") as it is already registered/configured.");

                return;
            }
        }

        console.log("Advertise availability of device");

        newDevice.plugin = this.deviceTypePlugin;

        // TODO Retrieve Plugin name

        newDevice.label = utils.getNextDefaultLabel(this.node.devices, this.deviceTypePlugin, 1);

        if (this.confirmRegistration) {
            this.node.pendingDeviceRegistrations[newDevice.uuid] = newDevice;

            this.logDebug("\tAdvertising Device [" + newDevice.label + "].");
            this.node.publishDeviceAdvertisement(newDevice);
        }
        else {
            // TODO For now, always persist
            if (true/*this.persistRegistration*/) {
                this.logDebug("Persist Device Registration for Device [" + newDevice.label + "].");

                this.node.createDevice(newDevice);
            }
            else {
                // Nothing?
            }
        }
    };
}