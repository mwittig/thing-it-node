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
        id: "sensorTagLounge",
        label: "Sensor Tag Lounge",
        plugin: "ti-sensortag/tiSensorTag",
        configuration: {
            uuid: "3b34d7c7160d429fbe9552d46114e29c",
            simulated: false,
            barometricPressureEnabled: true,
            irTemperatureEnabled: false,
            ambientTemperatureEnabled: true,
            accelerometerEnabled: false,
            gyroscopeEnabled: false,
            magnetometerEnabled: false,
            humidityEnabled: true,
            luminousIntensity: true
        },
        actors: [],
        sensors: []
    }, {
        label: "AirCable SmartDimmer Lounge",
        id: "airCableSmartDimmerLounge",
        plugin: "aircable/airCableSmartDimmer",
        configuration: {
            simulated: true,
            minimumLevel: 0,
            maximumLevel: 100,
            step: 5
        },
        actors: [],
        sensors: []
    }, {
        label: "AirCable SmartDimmer Hallway",
        id: "airCableSmartDimmerHallway",
        plugin: "aircable/airCableSmartDimmer",
        configuration: {
            simulated: true,
            minimumLevel: 0,
            maximumLevel: 100,
            step: 5
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
    }, {
        id: "eventProcessor4",
        label: "Event Processor 4",
        observables: ["sensorTagLounge"],
        window: {
            "duration": 10000
        },
        match: "maximum(sensorTagLounge.luminousIntensity.series) > 1500",
        content: {
            type: "script",
            script: "airCableSmartDimmerLounge.toggle(); airCableSmartDimmerHallway.toggle();"
        }
    }, {
        id: "eventProcessor5",
        label: "Event Processor 5",
        observables: ["sensorTagLounge"],
        match: "sensorTagLounge.event.type == 'stateChange'",
        content: {
            type: "script",
            script: "airCableSmartDimmerLounge.changeLevel({level: eventProcessor5.sensorTagLounge.event.state.luminousIntensity - 1500 })"
        }
    }]
};
