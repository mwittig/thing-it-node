module.exports = {
    label: "Home",
    id: "home",
    autoDiscoveryDeviceTypes: [{
            plugin: "ti-sensor-tag/tiSensorTag",
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
    }//, drone 7e7c3915d2704444bef61e0cc81a4225
    ],
    services: [],
    eventProcessors: [{
        id: "eventProcessor1",
        label: "Event Processor 1",
        observables: ["sensorTagLounge"],
        match: "sensorTagLounge.event.type == 'left'",
        content: {
            type: "script",
            script: "console.log('====> Right fired')"
        }
    }, {
        id: "eventProcessor2",
        label: "Event Processor 2",
        observables: ["sensorTagLounge"],
        match: "sensorTagLounge.event.type == 'right'",
        content: {
            type: "script",
            script: "console.log('====> Left fired')"
        }
    }, {
        id: "eventProcessor3",
        label: "Event Processor 3",
        observables: ["sensorTagLounge"],
        match: "sensorTagLounge.event.type == 'both'",
        content: {
            type: "script",
            script: "console.log('====> Both fired')"
        }
    }]
};
