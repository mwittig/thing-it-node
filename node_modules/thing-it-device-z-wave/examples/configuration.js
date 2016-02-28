module.exports = {
    label: "Suite 1302",
    id: "suite1302",
    autoDiscoveryDeviceTypes: [/*{
     plugin: "z-wave/zWaveNetwork",
     confirmRegistration: true,
     persistRegistration: false,
     defaultConfiguration: {},
     options: {}
     }*/],
    devices: [{
        label: "Z-Wave Network",
        id: "zWaveNetwork",
        plugin: "z-wave/zWaveNetwork",
        configuration: {},
        logLevel: "debug",
        actors: [{
            id: "multilevelSensor1",
            label: "Multilevel Sensor 1",
            type: "multilevelSensor",
            configuration: {
                nodeId: 2
            },
            logLevel: "debug"
        }, {
            id: "binaryPowerSwitch1",
            label: "Binary Power Switch 1",
            type: "binaryPowerSwitch",
            configuration: {
                nodeId: 3
            },
            logLevel: "debug"
        }, {
            id: "binaryPowerSwitch2",
            label: "Binary Power Switch 2",
            type: "binaryPowerSwitch",
            configuration: {
                nodeId: 4
            },
            logLevel: "debug"
        }, {
            id: "routingBinarySensor1",
            label: "Routing Binary Sensor 1",
            type: "routingBinarySensor",
            configuration: {
                nodeId: 5
            },
            logLevel: "debug"
        }, {
            id: "thermostatGeneric1",
            label: "Thermostat Generic 1",
            type: "thermostatGeneric",
            configuration: {
                nodeId: 8
            },
            logLevel: "debug"
        }],
        sensors: []
    }],
    groups: [],
    services: [],
    eventProcessors: [],
    data: []
};
