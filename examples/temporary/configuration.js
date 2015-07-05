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
            "id": "LightSwitch",
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
        "id": "ArduinoUno",
        "label": "Arduino Uno"
    }],
    "services": [{
        "id": "LightSwitchService",
        "label": "Light Switch Service",
        "content": {
            "type": "script",
            "script": "if (ArduinoUno.led1.state.light == 'off'){   ArduinoUno.led1.on();   ArduinoUno.led2.on();}else{   ArduinoUno.led1.off();   ArduinoUno.led2.off();}"
        }
    }],
    "eventProcessors": [{
        "id": "onLightSwitch",
        "label": "on Light Switch",
        "type": "script",
        "observables": ["ArduinoUno.LightSwitch"],
        "match": "ArduinoUno.LightSwitch.event.type == 'hold'",
        "content": {"type": "script", "script": "LightSwitchService()"}
    }],
    "groups": [],
    "jobs": [],
    "data": [],
    "lastModificationTimestamp": 1436121463585,
    "connectionMode": "simulated"
};