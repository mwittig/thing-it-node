module.exports = {
    metadata: {
        plugin: "switch",
        label: "Switch",
        role: "sensor",
        family: "switch",
        deviceTypes: ["virtual-device/virtualDevice"],
        configuration: []
    },
    create: function () {
        return new Switch();
    }
};

/**
 *
 */
function Switch() {
    /**
     *
     */
    Switch.prototype.start = function () {
        try {
        } catch (x) {
            this.publishMessage("Cannot initialize " + this.device.id + "/"
            + this.id + ":" + x);
        }
    };
};