module.exports = {
    label: "Home",
    id: "home",
    devices: [{
        label: "TV Remote",
        id: "tv Remote",
        plugin: "itach/tvRemote",
        configuration: {
            simulated: false,
            host: "192.168.10.1"
        },
        actors: [],
        sensors: []
    }],
    services: [],
    eventProcessors: []
};
