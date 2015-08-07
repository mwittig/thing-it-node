module.exports = {
    label: "Home",
    id: "home",
    devices: [],
    groups: [{
        id: "group1",
        label: "Our Home",
        icon: "home",
        subGroups: [{
            id: "group1",
            label: "Group 1",
            icon: "train",
            subGroups: [],
            devices: [],
            actors: [],
            sensors: [],
            services: ["testExternalRestPost"]
        }]
    }],
    services: [{
        id: "testExternalRestGet",
        label: "Test External REST/GET",
        type: "externalRestService",
        content: {
            method: "GET",
            url: "http://localhost:3000/_test"
        }
    }, {
        id: "testExternalRestPost",
        label: "Test External REST/POST",
        type: "externalRestService",
        content: {
            method: "POST",
            url: "http://localhost:3000/_test"
        }
    }, {
        id: "testRemoteNode",
        label: "Test Remote Node",
        type: "remoteNodeService",
        content: {
            node: "c0fb5520-2418-11e5-948f-2764e628de85",
            service: "test"
        }
    }, {
        id: "testScript",
        label: "Test Script",
        type: "scriptService",
        content: {
            script: "console.log('<<<<<< HELLO WORLD >>>>>>');\nconsole.log(\"<<<<<< HEY, JOE >>>>>>\");"
        }
    }],
    eventProcessors: [],
    data: []
};
