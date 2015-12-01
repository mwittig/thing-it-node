module.exports = {
    metadata: {
        family: "slider",
        plugin: "slider",
        label: "Virtual Slider",
        tangible: true,
        discoverable: false,
        state: [{
            id: "value",
            label: "Value",
            type: {
                id: "number"
            }
        }],
        actorTypes: [],
        sensorTypes: [],
        services: [{
            id: "change",
            label: "Change"
        }],
        configuration: [{
            label: "Rate",
            id: "rate",
            type: {
                id: "integer"
            },
            defaultValue: 1000,
            unit: "ms"
        }, {
            label: "Minimum",
            id: "min",
            type: {
                id: "integer"
            },
            defaultValue: 0
        }, {
            label: "Maximum",
            id: "max",
            type: {
                id: "integer"
            },
            defaultValue: 1023
        }]
    },
    create: function () {
        return new Slider();
    }
};

/**
 *
 */
function Slider() {
    /**
     *
     */
    Slider.prototype.start = function () {
        this.state = {value: this.configuration.minimum};
    };

    /**
     *
     */
    Slider.prototype.stop = function () {
    };

    /**
     *
     */
    Slider.prototype.getState = function () {
        return state;
    };

    /**
     *
     */
    Slider.prototype.setState = function (state) {
        this.state = state;
    };

    /**
     *
     */
    Slider.prototype.change = function (parameters) {
        this.state.value = parameters.value;
    };
};