module.exports = {
    metadata: {
        family: "switch",
        plugin: "switch",
        label: "Virtual Switch",
        tangible: true,
        discoverable: false,
        state: [{
            id: "switch",
            label: "Switch",
            type: {
                id: "boolean"
            }
        }],
        actorTypes: [],
        sensorTypes: [],
        services: [{
            id: "on",
            label: "On"
        }, {
            id: "off",
            label: "Off"
        }, {
            id: "toggle",
            label: "toggle"
        }],
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
        this.state = {switch: false}
    };

    /**
     *
     */
    Switch.prototype.stop = function () {
    };

    /**
     *
     */
    Switch.prototype.on = function () {
        this.state.switch = true;

        this.publishStateChange();
    };

    /**
     *
     */
    Switch.prototype.off = function () {
        this.state.switch = false;

        this.publishStateChange();
    };

    /**
     *
     */
    Switch.prototype.toggle = function () {
        this.state.switch = !this.state.switch;

        this.publishStateChange();
    };
};