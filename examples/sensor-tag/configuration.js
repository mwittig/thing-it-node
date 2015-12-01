module.exports = {
    label: "Home",
    id: "home",
    autoDiscoveryDeviceTypes: [{
        plugin: "ti-sensortag/tiSensorTag",
        confirmRegistration: true,
        persistRegistration: false,
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
    }
    ],
    devices: [{
        uuid: "9ef7f55f18d448e4888f34ca397753ef", //3b34d7c7160d429fbe9552d46114e29c
        id: "sensorTagLounge",
        label: "Sensor Tag Lounge",
        plugin: "ti-sensortag/tiSensorTag",
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
    }],
    services: [],
    eventProcessors: [{
        id: "eventProcessor1",
        label: "Event Processor 1",
        observables: ["sensorTagLounge"],
        match: "sensorTagLounge.event.type == 'left'",
        type: "script",
        content: {
            script: "console.log('====> Right fired')"
        }
    }, {
        id: "eventProcessor2",
        label: "Event Processor 2",
        observables: ["sensorTagLounge"],
        match: "sensorTagLounge.event.type == 'right'",
        type: "script",
        content: {
            script: "console.log('====> Left fired')"
        }
    }, {
        id: "eventProcessor3",
        label: "Event Processor 3",
        observables: ["sensorTagLounge"],
        match: "sensorTagLounge.event.type == 'both'",
        type: "script",
        content: {
            script: "console.log('====> Both fired')"
        }
    }, {
        id: "eventProcessor4",
        label: "Event Processor 4",
        observables: ["sensorTagLounge"],
        window: {
            "duration": 10000
        },
        type: "script",
        match: "maximum(sensorTagLounge.luminousIntensity.series) > 1500",
        content: {
            script: "console.log('Maximum of luminous intensity exceeds 1500 Lux.')"
        }
    }]
};
