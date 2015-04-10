module.exports = {
    label: "Home",
    id: "home",
    autoDiscoveryDeviceTypes: [],
    devices: [{
        id: "heartRateJenn",
        label: "Heart Rate Jenn",
        plugin: "heart-rate-monitor/heartRateMonitor",
        configuration: {},
        actors: [],
        sensors: []
    }, {
        id: "heartRateFrank",
        label: "Heart Rate Frank",
        plugin: "heart-rate-monitor/heartRateMonitor",
        configuration: {},
        actors: [],
        sensors: []
    }],
    services: [],
    eventProcessors: []
};
