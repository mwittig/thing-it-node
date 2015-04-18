module.exports = {
    label: "Home",
    id: "home",
    autoDiscoveryDeviceTypes: [],
    devices: [{
        id: "heartMonitorJenn",
        label: "Heart Monitor Jenn",
        plugin: "heart-rate-monitor/heartRateMonitor",
        configuration: {},
        actors: [],
        sensors: []
    }, {
        id: "heartMonitorFrank",
        label: "Heart Monitor Frank",
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
        devices: ["heartMonitorJenn", "heartMonitorFrank"],
        actors: [],
        sensors: [],
        services: []
    }],
    services: [],
    eventProcessors: []
};
