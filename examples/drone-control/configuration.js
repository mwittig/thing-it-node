module.exports = {
    label: "Home",
    id: "home",
    devices: [{
        label: "Parrot Rolling Spider Drone",
        id: "parrotRollingSpiderDrone",
        plugin: "ar-drone/ardroneBluetoothLE",
        configuration: [],
        actors: [],
        sensors: []
    }, {
        label: "Parrot AR Drone",
        id: "parrotARDrone",
        plugin: "ar-drone/ardroneWifi",
        configuration: [],
        actors: [],
        sensors: []
    }],
    services: [],
    eventProcessors: []
};
