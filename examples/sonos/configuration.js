module.exports = {
    label: "Home",
    id: "home",
    devices: [{
        label: "Sonos",
        id: "sonos",
        plugin: "sonos/sonos",
        configuration: {
            simulated: false,
            host: "sonosHost",
            name: "My Sonos"
        },
        actors: [],
        sensors: []
    }],
    services: [],
    eventProcessors: []
};
