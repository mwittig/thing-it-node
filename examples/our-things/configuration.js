module.exports = {
    uuid: "791cb970-d408-11e4-b424-7b0ff9c5b77e",
    label: "Home",
    id: "home",
    devices: [{
        uuid: "9ef7f55f18d448e4888f34ca397753ef",
        id: "sensorTagDiningRoom",
        label: "Sensor Tag Dining Room",
        plugin: "ti-sensor-tag/tiSensorTag",
        configuration: {
            barometricPressureEnabled: true,
            irTemperatureEnabled: false,
            ambientTemperatureEnabled: true,
            accelerometerEnabled: false,
            gyroscopeEnabled: false,
            magnetometerEnabled: false,
            humidityEnabled: true
        },
        actors: [],
        sensors: []
    }, {
        id: "heartMonitorJenn",
        label: "Heart Monitor Jenn",
        plugin: "heart-rate-monitor/heartRateMonitor",
        configuration: {},
        actors: [],
        sensors: []
    }, {
        id: "heartMonitorFrank",
        label: "Heart Monitor Frank",
        plugin: "heart-rate-monitor/heartRateMonitor",
        configuration: {},
        actors: [],
        sensors: []
    }, {
        label: "USB Camera",
        id: "usbCamera",
        plugin: "usb-camera/usbCamera",
        configuration: {
            inputFormat: "avfoundation",
            inputDevice: "0",
            videoWidth: 320,
            videoHeight: 180,
            bufferFiles: 2,
            latency: 5
        },
        actors: [],
        sensors: []
    }, {
        label: "Surveillance Drone",
        id: "surveillanceDrone",
        plugin: "ar-drone/ardroneBluetoothLE",
        configuration: [],
        actors: [],
        sensors: []
    }],
    groups: [{
        id: "group1",
        label: "Our Home",
        icon: "home",
        subGroups: [{
            id: "diningRoom",
            label: "Dining Room",
            icon: "cutlery",
            subGroups: [],
            devices: ["sensorTagDiningRoom"],
            actors: [],
            sensors: [],
            services: []
        }, {
            id: "masterBedroom",
            label: "Master Bedroom",
            icon: "bed",
            subGroups: [],
            actors: [],
            sensors: [],
            services: []
        }, {
            id: "bedroomSandra",
            label: "Bedroom Sandra",
            icon: "bed",
            subGroups: [],
            actors: [],
            sensors: [],
            services: []
        }, {
            id: "bedroomKevin",
            label: "Bedroom Kevin",
            icon: "bed",
            subGroups: [],
            actors: [],
            sensors: [],
            services: []
        }]
    }, {
        id: "ourHealth",
        label: "Our Health",
        icon: "heartbeat",
        devices: ["heartMonitorJenn", "heartMonitorFrank"]
    }, {
        id: "ourEntertainment",
        label: "Our Entertainment",
        icon: "music"
    }, {
        id: "ourSecurity",
        label: "Our Security",
        icon: "video-camera",
        devices: ["usbCamera", "surveillanceDrone"]
    }],
    services: [],
    eventProcessors: [],
    data: []
};
