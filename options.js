/*module.exports = {
    port: 3001,
    protocol: "http",
    nodeConfigurationFile: "../examples/auto-discovery/configuration.js",
    dataDirectory: "../thing-it-data",
    usersDirectory: "../thing-it-users",
    simulated: true,
    verifyCallSignature: false,
    //publicKeyFile: "",
    //signingAlgorithm: "RSA-SHA256",
    authentication: "none",//"user",
    logLevel: "debug"
};*/

module.exports = {
    //uuid: "06f66250-241d-11e5-908b-d1730e52aab0",
    uuid: "c0fb5520-2418-11e5-948f-2764e628de85",
    //proxy: "http://www.thing-it.com",
    proxy: "http://localhost:3000",
    nodeConfigurationFile: "/Users/marcgille/git/thing-it-node/examples/temporary/configuration.js",
};