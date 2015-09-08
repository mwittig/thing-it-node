module.exports = {
    label: "Home",
    id: "home",
    devices: [{
        logLevel: "debug",
        label: "TV",
        id: "tv",
        plugin: "itach/tvRemote",
        configuration: {
            simulated: false,
            host: "192.168.1.5"
        },
        actors: [],
        sensors: []
    }, {
        logLevel: "debug",
        label: "EMOTIVA RM-100",
        id: "emotivaRm100",
        plugin: "itach/emotivaRm100",
        configuration: {
            simulated: false,
            host: "192.168.1.5"
        },
        actors: [],
        sensors: []
    }, {
        logLevel: "debug",
        label: "iRobot Roomba",
        id: "iRobotRoomba",
        plugin: "itach/iRobotRoombaRemote",
        configuration: {
            simulated: false,
            host: "192.168.1.5"
        },
        actors: [],
        sensors: []
    }, {
        logLevel: "debug",
        label: "IR Sniffer",
        id: "irSniffer",
        plugin: "itach/irSniffer",
        configuration: {
            simulated: false,
            host: "192.168.1.5"
        },
        actors: [],
        sensors: []
    }],
    services: [],
    eventProcessors: []
};
