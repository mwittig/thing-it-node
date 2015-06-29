module.exports = {
    "mesh": "559037cc197bbeda3b8fdfd4",
    "dataTypes": null,
    "simulated": true,
    "id": "node1",
    "label": "Node 1",
    "uuid": "84f2f730-1dc0-11e5-9850-c56b9b917679",
    "location": "local",
    "state": "unconfigured",
    "host": "localhost",
    "port": "3000",
    "devices": [{
        "actors": [{"type": "led", "id": "led1", "label": "LED 1", "configuration": {"pin": "12"}}],
        "sensors": [{
            "type": "button",
            "id": "button1",
            "label": "Button 1",
            "configuration": {
                "pin": "12",
                "holdtime": 500,
                "sendClickEvents": true,
                "sendDownEvents": true,
                "sendHoldEvents": true
            }
        }],
        "services": [],
        "plugin": "microcontroller/arduino",
        "id": "arduino1",
        "label": "Arduino Uno 1"
    }],
    "services": [{
        "id": "service1",
        "label": "Service1",
        "content": {"type": "script", "script": "arduino1.led1.on();"}
    }],
    "eventProcessors": [{
        "id": "eventProcessor1",
        "label": "Event Processor 1",
        "content": {"type": "actorService", "actor": "arduino1.led1", "service": "on"},
        "observables": ["arduino1.button1"],
        "match": "arduino1.button1.event.type == \"hold\"",
        "type": "script",
        "service": "on"
    }],
    "groups": [],
    "connectionMode": "simulated",
    "jobs": [],
    "data": [],
    "lastModificationTimestamp": 1435611167939
};