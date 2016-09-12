module.exports = {
    label: "Parking Garage",
    id: "parkingGarage",
    autoDiscoveryDeviceTypes: [],
    devices: [{
        label: "Lot A1",
        id: "lotA1",
        plugin: "occupancy-sensor/occupancySensor",
        configuration: {},
        logLevel: "debug",
        actors: [],
        sensors: []
    }],
    groups: [],
    services: [],
    eventProcessors: [],
    data: []
};
