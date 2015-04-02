module.exports = {
    label: "Home",
    id: "home",
    autoDiscoveryDeviceTypes: [{
        plugin: "ar-drone/ardroneBluetoothLE",
        confirmRegistration: false,
        persistRegistration: false,
        options: {}
    },
        {
            plugin: "ti-sensor-tag/tiSensorTag",
            confirmRegistration: true,
            persistRegistration: false,
            options: {}
        }

    ],
    devices: [],
    services: [],
    eventProcessors: []
};
