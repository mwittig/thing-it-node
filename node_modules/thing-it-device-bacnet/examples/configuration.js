module.exports = {
    "label": "Default",
    "id": "default",
    "autoDiscoveryDeviceTypes": [],
    "devices": [
        {
            "plugin": "bacnet/bacNetDevice",
            "actors": [
                {
                    "id": "binaryInput1",
                    "label": "Binary Input 1",
                    "type": "binaryInput",
                    "logLevel": "debug",
                    "configuration": {
                        //"simulated": true,
                        "objectId": "13",
                        "objectType": "BinaryValue",
                        "objectName": "alRainFb",
                        "description": "Rain alarm"
                    }
                },
                {
                    "id": "binaryValue1",
                    "label": "Binary Value 1",
                    "type": "binaryValue",
                    "logLevel": "debug",
                    "configuration": {
                        //"simulated": true,
                        "objectId": "12",
                        "objectType": "BinaryValue",
                        "objectName": "alWindFb",
                        "description": "Wind alarm"
                    }
                },
                {
                    "id": "analogInput1",
                    "label": "Analog Input 1",
                    "type": "analogInput",
                    "logLevel": "debug",
                    "configuration": {
                        //"simulated": true,
                        "objectId": "73",
                        "objectType": "AnalogValue",
                        "objectName": "spDisplayFb",
                        "description": "Displayed setpoint feedback (heat/cool average)"
                    }
                },
                {
                    "id": "analogValue1",
                    "label": "Analog Value 1",
                    "type": "analogValue",
                    "logLevel": "debug",
                    "configuration": {
                        //"simulated": true,
                        "objectId": "69",
                        "objectType": "AnalogValue",
                        "objectName": "spExt",
                        "description": "External setpoint write",
                        "minValue": 0,
                        "maxValue": 30
                    }
                }
            ],
            "sensors": [],
            "services": [],
            "class": "Device",
            "id": "bacnet1",
            "label": "BACnet 1",
            "configuration": {
                //"simulated": true,
                "ipAddress": "192.168.5.104",
                "bacNetId": "1",
                "deviceId": "1"
            }
        }],
    "services": [],
    "eventProcessors": [],
    "groups": [],
    "jobs": [],
    "data": []
};