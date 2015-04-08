module.exports = {
    label: "Home",
    id: "home",
    autoDiscoveryDeviceTypes: [],
    devices: [{
        id: "heartRateMonitor",
        label: "Heart Rate Monitor",
        plugin: "heart-rate-monitor/heartRateMonitor",
        configuration: {},
        actors: [],
        sensors: []
    }],
    services: [],
    eventProcessors: []
};
