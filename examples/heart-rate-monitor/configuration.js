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
    groups: [{
        id: "familyHealth",
        label: "Family Health",
        icon: "home",
        subGroups: [],
        devices: ["heartRateJenn", "heartRateFrank"],
        actors: [],
        sensors: [],
        services: []
    }],
    services: [],
    eventProcessors: []
};
