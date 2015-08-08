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
            simulated: true,
            barometricPressureEnabled: true,
            irTemperatureEnabled: true,
            irTemperatureNotificationInterval: 2000,
            ambientTemperatureEnabled: true,
            ambientTemperatureNotificationInterval: 2000,
            accelerometerEnabled: true,
            accelerometerNotificationInterval: 300,
            gyroscopeEnabled: true,
            gyroscopeNotificationInterval: 300,
            magnetometerEnabled: true,
            magnetometerNotificationInterval: 300,
            humidityEnabled: true,
            humidityNotificationInterval: 2000,
            luminousIntensity: true,
            luminousIntensityNotificationInterval: 2000
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
    }, {
        label: "AirCable SmartDimmer Studio",
        id: "airCableSmartDimmerStudio",
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
    services: [{
        id: "storyboard1",
        label: "At Home Simulation",
        description: "Simulate lighting etc. as the family was at home.",
        type: "storyboard",
        content: {
            easingInterval: 100,
            timeline: [{
                timestamp: 0,
                entries: [{
                    type: "deviceServiceCall",
                    device: "airCableSmartDimmerStudio",
                    service: "on"
                }]
            }, {
                timestamp: 2000,
                entries: [{
                    type: "deviceServiceCall",
                    device: "airCableSmartDimmerStudio",
                    service: "off"
                }, {
                    type: "deviceStateChange",
                    device: "airCableSmartDimmerStudio",
                    state: {
                        level: 0
                    }
                }]
            }, {
                timestamp: 5000,
                entries: [{
                    type: "deviceServiceCall",
                    device: "airCableSmartDimmerStudio",
                    service: "on"
                }, {
                    type: "deviceStateChange",
                    device: "airCableSmartDimmerStudio",
                    state: {
                        level: 100
                    },
                    easing: "linear"
                }]
            }, {
                timestamp: 8000,
                entries: [{
                    type: "deviceServiceCall",
                    type: "deviceServiceCall",
                    device: "airCableSmartDimmerStudio",
                    service: "off"
                }]
            }, {
                timestamp: 11000,
                entries: [{
                    type: "deviceServiceCall",
                    device: "airCableSmartDimmerStudio",
                    service: "on"
                }]
            }, {
                timestamp: 14000,
                entries: [{
                    type: "deviceServiceCall",
                    device: "airCableSmartDimmerStudio",
                    service: "off"
                }, {
                    type: "deviceStateChange",
                    device: "airCableSmartDimmerStudio",
                    state: {
                        level: 0
                    },
                    easing: "linear"
                }]
            }]
        }
    }],
    eventProcessors: [{
        id: "eventProcessor4",
        label: "Event Processor 4",
        observables: ["sensorTagLounge"],
        window: {
            "duration": 10000
        },
        match: "maximum(sensorTagLounge.luminousIntensity.series) > 1500",
        type: "script",
        content: {
            script: "airCableSmartDimmerLounge.toggle(); airCableSmartDimmerHallway.toggle();"
        },
        logLevel: "info"
    }, {
        id: "eventProcessor5",
        label: "Event Processor 5",
        observables: ["sensorTagLounge"],
        match: "sensorTagLounge.event.type == 'stateChange'",
        type: "script",
        content: {
            script: "airCableSmartDimmerLounge.changeLevel({level: eventProcessor5.sensorTagLounge.event.state.luminousIntensity - 1500 })"
        },
        logLevel: "info"
    }]
};
