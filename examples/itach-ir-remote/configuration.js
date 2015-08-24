module.exports = {
    label: "Home",
    id: "home",
    devices: [{
        logLevel: "debug",
        label: "TV",
        id: "tv",
        plugin: "itach/tvRemote",
        configuration: {
            simulated: true,
            host: "192.168.10.1"
        },
        actors: [],
        sensors: []
    }, {
        logLevel: "debug",
        label: "iRobot Roomba",
        id: "iRobotRoomba",
        plugin: "itach/iRobotRoombaRemote",
        configuration: {
            simulated: true,
            host: "192.168.10.1"
        },
        actors: [],
        sensors: []
    }, {
        logLevel: "debug",
        label: "IR Sniffer",
        id: "irSniffer",
        plugin: "itach/irSniffer",
        configuration: {
            simulated: true,
            host: "192.168.10.1"
        },
        actors: [],
        sensors: []
    }],
    services: [],
    eventProcessors: []
};
