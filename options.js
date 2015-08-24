module.exports = {
    port: 3001,
    protocol: "http",
    nodeConfigurationFile: "../examples/itach-ir-remote/configuration.js",
    dataDirectory: "../thing-it-data",
    usersDirectory: "../thing-it-users",
    simulated: true,
    verifyCallSignature: false,
    authentication: "none",//"user",
    logLevel: "debug"
};

/*module.exports = {
 //uuid: "06f66250-241d-11e5-908b-d1730e52aab0",
 uuid: "c78bc100-24df-11e5-81a2-e3e7e2c44ba2",
 proxy: "http://www.thing-it.com",
 //proxy: "http://localhost:3000",
 nodeConfigurationFile: "/Users/marcgille/git/thing-it-node/examples/temporary/configuration.js",
 };*/