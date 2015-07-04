module.exports = {
    label: "Home",
    id: "home",
    devices: [{
        label: "AirCable SmartDimmer Lounge",
        id: "airCableSmartDimmer",
        plugin: "aircable/airCableSmartDimmer",
        configuration: {
            minimum: 0,
            maximum: 100
        },
        actors: [],
        sensors: []
    }],
    services: [],
    eventProcessors: []
};
