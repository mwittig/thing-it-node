var fs = require('fs');
var node = {
    label: "Mass Test",
    id: "massTest",
    autoDiscoveryDeviceTypes: [],
    devices: [],
    groups: [],
    services: [],
    eventProcessors: [],
    data: [],
    simulated: true,
    jobs: [],
    dataTypes: []
};

var group;
var device;

for (var n = 0; n < 50; ++n) {
    if (n % 10 == 0) {
        node.groups.push(group = {
            id: "health" + (n / 10 + 1),
            label: "Health " + (n / 10 + 1),
            icon: "icon sl-heartpulse",
            devices: [],
            "subGroups": []
        });
    }

    node.devices.push(device = {
        id: "heartMonitor" + n,
        label: "Heart Monitor " + n,
        "plugin": "btle-heart-rate-monitor/btleHeartRateMonitor",
        "configuration": {"simulated": true},
        "actors": [],
        "sensors": []
    });

    group.devices.push(device.id);
}

fs
    .writeFileSync(process.cwd() + "/test/massTest.js", 'module.exports = ' + JSON.stringify(node) + ';');
