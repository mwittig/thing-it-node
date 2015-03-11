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
            configuration: {
                pin: 12
            }
        }],
        sensors: []
    }],
    services: [],
    eventProcessors: [],
    data: []
};
