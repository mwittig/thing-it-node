module.exports = {
    label: "Test",
    id: "test",
    autoDiscoveryDeviceTypes: [],
    devices: [{
        label: "Test Device 1",
        id: "testDevice1",
        plugin: "test/testDevice",
        configuration: {},
        actors: [{
            id: "testActor1",
            label: "Test Actor 1",
            type: "testActor",
            configuration: {}
        }, {
            id: "testActor2",
            label: "Test Actor 2",
            type: "testActor",
            configuration: {}
        }],
        sensors: [{
            id: "testSensor1",
            label: "Test Sensor 1",
            type: "testSensor",
            configuration: {}
        }]
    }],
    groups: [],
    services: [],
    eventProcessors: [{
        id: "eventProcessor1",
        label: "Event Processor 1",
        observables: ["testDevice1.testSensor1"],
        trigger: {
            type: "event",
            content: {
                event: 'click'
            }
        },
        action: {
            type: "actorService",
            content: {
                device: 'testDevice1',
                actor: 'testActor1',
                service: 'on'
            }
        }
    }, {
        id: "eventProcessor2",
        label: "Event Processor 2",
        observables: ["testDevice1.testActor2"],
        trigger: {
            type: "singleStateChange",
            content: {
                field: 'light'
            }
        },
        action: {
            type: "actorService",
            content: {
                device: 'testDevice1',
                actor: 'testActor1',
                service: 'on'
            }
        }
    }, {
        id: "eventProcessor3",
        label: "Event Processor 3",
        observables: ["testDevice1.testSensor1"],
        trigger: {
            type: "singleStateChange",
            content: {
                field: 'booleanField1'
            }
        },
        action: {
            type: "actorService",
            content: {
                device: 'testDevice1',
                actor: 'testActor1',
                service: 'on'
            }
        }
    }],
    data: []
};
