module.exports = {
    label: "Home",
    id: "home",
    devices: [{
        label: "AirCable SmartDimmer Lounge",
        id: "airCableSmartDimmer",
        plugin: "aircable/airCableSmartDimmer",
        configuration: {
            minimum: 0,
            maximum: 100
        },
        actors: [],
        sensors: []
    }/*, {
        uuid: "9ef7f55f18d448e4888f34ca397753ef",
        id: "sensorTagLounge",
        label: "Sensor Tag Lounge",
        plugin: "ti-sensor-tag/tiSensorTag",
        configuration: {
            barometricPressureEnabled: false,
            irTemperatureEnabled: false,
            ambientTemperatureEnabled: true,
            accelerometerEnabled: false,
            gyroscopeEnabled: false,
            magnetometerEnabled: false,
            humidityEnabled: true
        },
        actors: [],
        sensors: []
    }*/],
    services: [],
    eventProcessors: []
};
