module.exports = {
    label: "Home",
    id: "home",
    devices: [{
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
        label: "USB Microphone",
        id: "usbMicrophone",
        plugin: "usb-microphone/usbMicrophone",
        configuration: [],
        actors: [],
        sensors: []
    }],
    services: [],
    eventProcessors: []
};
