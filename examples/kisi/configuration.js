module.exports = {
    label: "Home",
    id: "home",
    devices: [{
        label: "Kisi Locks",
        id: "kisi",
        plugin: "kisi/Kisi",
        configuration: {
            minimum: 0,
            maximum: 100
        },
        actors: [],
        sensors: []
    }, {
        uuid: "9ef7f55f18d448e4888f34ca397753ef",
        id: "kisiLounge",
        label: "Kisi Lounge",
        plugin: "ti-sensortag/tiSensorTag",
        configuration: {
        },
        actors: [],
        sensors: []
    }],
    services: [],
    eventProcessors: []
};
