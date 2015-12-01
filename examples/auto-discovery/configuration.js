module.exports = {
    label: "Autodiscovery",
    id: "autodiscovery",
    autoDiscoveryDeviceTypes: [{
        plugin: "ti-sensortag/tiSensorTag",
        confirmRegistration: true,
        persistRegistration: true,
        defaultConfiguration: {
            barometricPressureEnabled: false,
            irTemperatureEnabled: false,
            ambientTemperatureEnabled: false,
            accelerometerEnabled: true,
            gyroscopeEnabled: false,
            magnetometerEnabled: false,
            humidityEnabled: false
        },
        options: {}
    }, {
        plugin: "philips-hue/hueBridge",
        confirmRegistration: true,
        persistRegistration: true,
        defaultConfiguration: {},
        options: {}
    }, {
        plugin: "foscam/camera",
        confirmRegistration: true,
        persistRegistration: true,
        defaultConfiguration: {},
        options: {}
    }],
    devices: [],
    services: [],
    eventProcessors: []
};
