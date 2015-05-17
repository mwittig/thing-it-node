module.exports = {
    uuid: "791cb970-d408-11e4-b424-7b0ff9c5b77e",
    label: "Home",
    id: "home",
    devices: [{
        label: "Arduino Uno 1",
        id: "arduino1",
        plugin: "microcontroller/arduino",
        actors: [{
            id: "led1",
            label: "LED1",
            type: "led",
            configuration: {
                "pin": 12
            }
        }, {
            id: "led2",
            label: "LED2",
            type: "led",
            configuration: {
                "pin": 13
            }
        }],
        sensors: [{
            id: "button1",
            label: "Button 1",
            type: "button",
            configuration: {
                "pin": 2
            }
        }, {
            id: "button2",
            label: "Button 2",
            type: "button",
            configuration: {
                "pin": 4
            }
        }, {
            id: "photocell1",
            label: "Photocell 1",
            type: "photocell",
            configuration: {
                "pin": "A0",
                "rate": 2000
            }
        }]
    }, {
        uuid: "9ef7f55f18d448e4888f34ca397753ef",
        id: "sensorTagDiningRoom",
        label: "Sensor Tag Dining Room",
        plugin: "ti-sensor-tag/tiSensorTag",
        configuration: {
            barometricPressureEnabled: true,
            irTemperatureEnabled: false,
            ambientTemperatureEnabled: true,
            accelerometerEnabled: false,
            gyroscopeEnabled: false,
            magnetometerEnabled: false,
            humidityEnabled: true
        },
        actors: [],
        sensors: []
    }, {
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
    }, {
        label: "USB Camera",
        id: "usbCamera",
        plugin: "usb-camera/usbCamera",
        configuration: {
            inputFormat: "avfoundation",
            inputDevice: "0",
            videoWidth: 320,
            videoHeight: 180,
            bufferFiles: 2,
            latency: 5
        },
        actors: [],
        sensors: []
    }, {
        label: "Surveillance Drone",
        id: "surveillanceDrone",
        plugin: "ar-drone/ardroneBluetoothLE",
        configuration: [],
        actors: [],
        sensors: []
    }],
    groups: [{
        id: "group1",
        label: "Our Home",
        icon: "home",
        subGroups: [{
            id: "diningRoom",
            label: "Dining Room",
            icon: "cutlery",
            subGroups: [],
            devices: ["sensorTagDiningRoom"],
            actors: ["arduino1.led1", "arduino1.led2"],
            sensors: ["arduino1.button1", "arduino1.button2",
                "arduino1.photocell1"],
            services: ["toggleAll"]
        }, {
            id: "masterBedroom",
            label: "Master Bedroom",
            icon: "bed",
            subGroups: [],
            actors: [],
            sensors: [],
            services: []
        }, {
            id: "bedroomSandra",
            label: "Bedroom Sandra",
            icon: "bed",
            subGroups: [],
            actors: [],
            sensors: [],
            services: []
        }, {
            id: "bedroomKevin",
            label: "Bedroom Kevin",
            icon: "bed",
            subGroups: [],
            actors: [],
            sensors: [],
            services: []
        }]
    }, {
        id: "ourHealth",
        label: "Our Health",
        icon: "heartbeat",
        devices: ["heartMonitorJenn", "heartMonitorFrank"]
    }, {
        id: "ourEntertainment",
        label: "Our Entertainment",
        icon: "music"
    }, {
        id: "ourSecurity",
        label: "Our Security",
        icon: "video-camera",
        devices: ["usbCamera", "surveillanceDrone"]
    }],
    services: [{
        id: "toggleAll",
        label: "Toggle All",
        content: {
            type: "script",
            script: "if (arduino1.led1.state.light == 'on') {arduino1.led1.off(); arduino1.led2.off();} else {arduino1.led1.on(); arduino1.led2.on();}"
        }
    }],
    eventProcessors: [
        {
            id: "eventProcessor1",
            label: "Event Processor 1",
            observables: ["arduino1.button1"],
            match: "arduino1.button1.event.type == 'hold'",
            content: {
                type: "script",
                script: "if (arduino1.led1.state.light == 'on') {arduino1.led1.off(); } else {arduino1.led1.on();}"
            }
        },
        {
            id: "eventProcessor2",
            label: "Event Processor 2",
            observables: ["arduino1.button2"],
            match: "arduino1.button2.event.type == 'hold'",
            content: {
                type: "script",
                script: "if (arduino1.led2.state.light == 'on') {arduino1.led2.off(); } else {arduino1.led2.on();}"
            }
        },
        {
            id: "eventProcessor3",
            label: "Event Processor 3",
            observables: ["arduino1.photocell1"],
            window: {
                "duration": 10000
            },
            match: "minimum(arduino1.photocell1.series) < 700 && deviation(arduino1.photocell1.series) < 100 && arduino1.photocell1.series.length > 1",
            content: {
                type: "script",
                script: "arduino1.led1.on(); arduino1.led2.on();"
            }
        }],
    data: []
};
