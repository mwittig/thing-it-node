module.exports = {
    label: "Z-Wave Empty",
    id: "zWaveEmpty",
    autoDiscoveryDeviceTypes: [{
        plugin: "z-wave/zWaveNetwork",
        confirmRegistration: true,
        persistRegistration: true,
        defaultConfiguration: {},
        options: {}
    }],
    devices: [],
    groups: [],
    services: [],
    eventProcessors: [],
    data: []
};
