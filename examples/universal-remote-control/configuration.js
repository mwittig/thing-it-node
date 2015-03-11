module.exports = {
    label: "Home",
    id: "home",
    devices: [{
        label: "Arduino Uno 1",
        id: "arduino1",
        plugin: "microcontroller/arduino",
        actors: [{
            id: "samsungTVInfraredRemote",
            label: "Samsung TV Infrared Remote",
            type: "samsungTVInfraredRemote",
            configuration: {}
        }],
        sensors: []
    }],
    services: [],
    eventProcessors: [],
    data: []
};
