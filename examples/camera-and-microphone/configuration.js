module.exports = {
    label: "Home",
    id: "home",
    devices: [{
        label: "USB Camera",
        id: "usbCamera",
        plugin: "usb-camera/usbCamera",
        configuration: [],
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
