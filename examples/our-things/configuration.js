module.exports = {
    "id": "home",
    "label": "Home",
    "lastConfigurationTimestamp": 1445014833171,
    "devices": [{
        "id": "arduino1",
        "label": "Arduino Uno 1",
        "plugin": "microcontroller/arduino",
        "configuration": {"simulated": true},
        "actors": [{
            "id": "led1",
            "label": "LED1",
            "type": "led",
            "configuration": {"pin": 12, "simulated": true}
        }, {
            "id": "led2",
            "label": "LED2",
            "type": "led",
            "configuration": {"pin": 13, "simulated": true}
        }, {
            "id": "rgbLed1",
            "label": "LED (RGB)",
            "type": "rgbLed",
            "configuration": {"pinRed": 3, "pinGreen": 5, "pinBlue": 6, "simulated": true}
        }, {
            "id": "servo1",
            "label": "Servo 1",
            "type": "servo",
            "configuration": {"pin": 10, "minimum": 45, "maximum": 135, "startAt": 120, "simulated": true}
        }],
        "sensors": [{
            "id": "button1",
            "label": "Button 1",
            "type": "button",
            "configuration": {"pin": 2, "simulated": true}
        }, {
            "id": "button2",
            "label": "Button 2",
            "type": "button",
            "configuration": {"pin": 4, "simulated": true}
        }, {
            "id": "photocell1",
            "label": "Photocell 1",
            "type": "photocell",
            "configuration": {"pin": "A0", "rate": 2000, "simulated": true}
        }, {
            "id": "potentiometerRed",
            "label": "Red Value",
            "type": "potentiometer",
            "configuration": {"pin": "A0", "rate": 100, "min": 0, "max": 255, "simulated": true}
        }, {
            "id": "potentiometerGreen",
            "label": "Green Value",
            "type": "potentiometer",
            "configuration": {"pin": "A1", "rate": 100, "min": 0, "max": 255, "simulated": true}
        }, {
            "id": "potentiometerBlue",
            "label": "Blue Value",
            "type": "potentiometer",
            "configuration": {"pin": "A2", "rate": 100, "min": 0, "max": 255, "simulated": true}
        }]
    }, {
        "id": "artNetUniverse1",
        "label": "Art-Net Universe 1",
        "plugin": "art-net/artNetUniverse",
        "configuration": {},
        "actors": [{
            "id": "rgbLed1",
            "label": "RGB LED1",
            "type": "rgbLed",
            "configuration": {"dmxStartAddress": 1, "simulated": true}
        }],
        "sensors": []
    }, {
        "id": "airCableSmartDimmerMasterBedroom1",
        "label": "AirCable SmartDimmer Master Bedroom 1",
        "plugin": "aircable/airCableSmartDimmer",
        "configuration": {"minimum": 0, "maximum": 100, "simulated": true},
        "actors": [],
        "sensors": []
    }, {
        "id": "airCableSmartDimmerMasterBedroom2",
        "label": "AirCable SmartDimmer Master Bedroom 2",
        "plugin": "aircable/airCableSmartDimmer",
        "configuration": {"minimum": 0, "maximum": 100, "simulated": true},
        "actors": [],
        "sensors": []
    }, {
        "id": "airCableSmartDimmerMasterBedroom3",
        "label": "AirCable SmartDimmer Master Bedroom 3",
        "plugin": "aircable/airCableSmartDimmer",
        "configuration": {"minimum": 0, "maximum": 100, "simulated": true},
        "actors": [],
        "sensors": []
    }, {
        "id": "philipsHueBridge",
        "label": "Philips Hue Bridge",
        "plugin": "philips-hue/hueBridge",
        "configuration": {"simulated": true},
        "actors": [{
            "id": "lightBulbKitchenCounter",
            "label": "Light Bulb Kitchen Counter",
            "type": "lightBulb",
            "configuration": {"index": 1, "simulated": true}
        }, {
            "id": "lightBulbCouch",
            "label": "Light Bulb Couch",
            "type": "lightBulb",
            "configuration": {"index": 2, "simulated": true}
        }, {
            "id": "livingColorLampBar",
            "label": "Living Color Lamp Bar",
            "type": "livingColorLamp",
            "configuration": {"index": 3, "simulated": true}
        }],
        "sensors": []
    }, {
        "id": "sensorTagDiningRoom",
        "label": "Sensor Tag Dining Room",
        "plugin": "ti-sensortag/tiSensorTag",
        "configuration": {
            "barometricPressureEnabled": true,
            "irTemperatureEnabled": false,
            "ambientTemperatureEnabled": true,
            "accelerometerEnabled": false,
            "gyroscopeEnabled": false,
            "magnetometerEnabled": false,
            "humidityEnabled": true,
            "simulated": true
        },
        "actors": [],
        "sensors": []
    }, {
        "id": "heartMonitorJenn",
        "label": "Heart Monitor Jenn",
        "plugin": "btle-heart-rate-monitor/btleHeartRateMonitor",
        "configuration": {"simulated": true},
        "actors": [],
        "sensors": []
    }, {
        "id": "heartMonitorFrank",
        "label": "Heart Monitor Frank",
        "plugin": "btle-heart-rate-monitor/btleHeartRateMonitor",
        "configuration": {"simulated": true},
        "actors": [],
        "sensors": []
    }, {
        "id": "sonos",
        "label": "Sonos",
        "plugin": "sonos/sonos",
        "configuration": {"host": "sonosHost", "name": "My Sonos", "simulated": true},
        "actors": [],
        "sensors": []
    }, {
        "id": "yamaha",
        "label": "Yamaha Amplifier",
        "plugin": "yamaha/yamaha",
        "configuration": {"host": "yamahaHost", "name": "Yamaha Host", "updateInterval": 1000, "simulated": true},
        "actors": [],
        "sensors": []
    }, {
        "id": "samsungTv",
        "label": "Samsung TV",
        "plugin": "itach/tvRemote",
        "configuration": {"simulated": true, "host": "192.168.10.1"},
        "actors": [],
        "sensors": []
    }, {
        "id": "iRobotRoomba",
        "label": "iRobot Roomba",
        "plugin": "itach/iRobotRoombaRemote",
        "configuration": {"simulated": true, "host": "192.168.10.1"},
        "actors": [],
        "sensors": []
    }, {
        "id": "surveillanceDrone",
        "label": "Surveillance Drone",
        "plugin": "ar-drone/ardroneBluetoothLE",
        "configuration": {"simulated": true},
        "actors": [],
        "sensors": []
    }],
    "services": [{
        "id": "toggleAll",
        "label": "Toggle All",
        "type": "script",
        "content": {script: "philipsHueBridge.lightBulbKitchenCounter.toggle();philipsHueBridge.lightBulbCouch;philipsHueBridge.livingColorLampBar;"}
    }, {
        "id": "stepLeft",
        "label": "Step Left",
        "type": "script"
    }, {"id": "stepRight", "label": "Step Right", "type": "script"}],
    "groups": [{
        "id": "group1",
        "label": "Our Home",
        "icon": "icon sl-house-1",
        "subGroups": [{
            "id": "diningRoom",
            "label": "Dining Room",
            "icon": "icon sl-fork-and-knife",
            "devices": ["iRobotRoomba"],
            "actors": ["arduino1.led1", "arduino1.led2"],
            "sensors": ["arduino1.button1", "arduino1.button2", "arduino1.photocell1"],
            "subGroups": []
        }, {
            "id": "lounge",
            "label": "Lounge",
            "icon": "icon sl-sofa-3",
            "actors": ["philipsHueBridge.lightBulbKitchenCounter", "philipsHueBridge.lightBulbCouch", "philipsHueBridge.livingColorLampBar"],
            "sensors": [],
            "subGroups": []
        }, {
            "id": "masterBedroom",
            "label": "Master Bedroom",
            "icon": "icon sl-bed",
            "devices": ["airCableSmartDimmerMasterBedroom1", "airCableSmartDimmerMasterBedroom2", "airCableSmartDimmerMasterBedroom3"],
            "actors": [],
            "sensors": [],
            "subGroups": []
        }, {
            "id": "bedroomSandra",
            "label": "Bedroom Sandra",
            "icon": "icon sl-bed",
            "actors": [],
            "sensors": [],
            "subGroups": []
        }, {
            "id": "bedroomKevin",
            "label": "Bedroom Kevin",
            "icon": "icon sl-bed",
            "actors": [],
            "sensors": [],
            "subGroups": []
        }, {
            "id": "partyRoom",
            "label": "Party Room",
            "icon": "icon sl-cocktail-1",
            "actors": ["arduino1.rgbLed1", "artNetUniverse1.rgbLed1"],
            "sensors": ["arduino1.potentiometerRed", "arduino1.potentiometerGreen", "arduino1.potentiometerBlue"],
            "subGroups": []
        }, {
            "id": "garden",
            "label": "Garden",
            "icon": "icon sl-tree",
            "devices": ["sensorTagDiningRoom"],
            "actors": [],
            "sensors": [],
            "subGroups": []
        }, {
            "id": "garage",
            "label": "Garage",
            "icon": "icon sl-car-3",
            "devices": [],
            "actors": ["arduino1.servo1"],
            "sensors": [],
            "subGroups": []
        }]
    }, {
        "id": "ourHealth",
        "label": "Our Health",
        "icon": "icon sl-heartpulse",
        "devices": ["heartMonitorJenn", "heartMonitorFrank"],
        "subGroups": []
    }, {
        "id": "ourEntertainment",
        "label": "Our Entertainment",
        "icon": "icon sl-notes-1",
        "devices": ["samsungTv", "sonos", "yamaha"],
        "subGroups": []
    }, {
        "id": "ourSecurity",
        "label": "Our Security",
        "icon": "icon sl-camera-symbol-3",
        "devices": ["surveillanceDrone"],
        "subGroups": []
    }],
    "eventProcessors": [{
        "id": "toggleAllOnTemperatur",
        "label": "Toggle all on Temperature",
        "observables": ["sensorTagDiningRoom"],
        "trigger": {
            "type": "timeInterval",
            "content": {
                "interval": 10000,
                "cumulation": "maximum",
                "stateVariable": "ambientTemperature",
                "compareOperator": ">",
                "compareValue": 28
            }
        },
        "action": {"type": "nodeService", "content": {"service": "toggleAll"}}
    }],
    "data": []
};