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
    devices: [{
        uuid: "9ef7f55f18d448e4888f34ca397753ef", //3b34d7c7160d429fbe9552d46114e29c
        id: "sensorTagLounge",
        label: "Sensor Tag Lounge",
        plugin: "ti-sensor-tag/tiSensorTag",
        configuration: [],
        actors: [],
        sensors: []
    }],
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
