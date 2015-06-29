module.exports = {
    "mesh": "558effe3f8afe3350e749ae4",
    "dataTypes": null,
    "simulated": true,
    "id": "ArduinoNode",
    "label": "Arduino Node",
    "uuid": "a67653d0-1d06-11e5-b093-0b903c4338ac",
    "location": "local",
    "state": "running",
    "host": "localhost",
    "port": "3000",
    "devices": [{
        "actors": [{
            "type": "led",
            "id": "led1",
            "label": "LED 1",
            "configuration": {"pin": "0"}
        }, {"type": "led", "id": "led2", "label": "LED 2", "configuration": {"pin": "1"}}],
        "sensors": [{
            "type": "button",
            "id": "Light-Switch",
            "label": "Light Switch",
            "configuration": {
                "pin": "2",
                "sendHoldEvents": true,
                "sendClickEvents": true,
                "sendDownEvents": false,
                "holdtime": 500
            }
        }],
        "services": [],
        "plugin": "microcontroller/arduino",
        "id": "Arduino-Uno",
        "label": "Arduino Uno"
    }],
    "services": [{
        "id": "lightSwitchService",
        "label": "lightSwitchService",
        "content": {
            "type": "script",
            "script": "if (Arduino-Uno.led1.state.light == \"off\")\n{\n   Arduino-Uno.led1.on();\n   Arduino-Uno.led2.on();\n}\nelse\n{\n   Arduino-Uno.led1.off();\n   Arduino-Uno.led2.off();\n}"
        }
    }],
    "eventProcessors": [{
        "id": "on-Light-Switch",
        "label": "on Light Switch",
        "content": {"type": "script"},
        "match": "Arduino-Uno.Light-Switch.event.click",
        "observables": ["Arduino-Uno.Light-Switch"]
    }],
    "groups": [],
    "jobs": [],
    "data": [],
    "lastModificationTimestamp": 1435436838109
};