module.exports = {
    metadata: {
        family: "button",
        plugin: "button",
        label: "Virtual Button",
        tangible: true,
        discoverable: false,
        state: [],
        actorTypes: [],
        sensorTypes: [],
        services: [{
            id: "click",
            label: "Click"
        }],
        configuration: []
    },
    create: function () {
        return new Button();
    }
};

/**
 *
 */
function Button() {
    /**
     *
     */
    Button.prototype.start = function () {
    };

    /**
     *
     */
    Button.prototype.stop = function () {
    };

    /**
     *
     */
    Button.prototype.click = function () {
    };
};