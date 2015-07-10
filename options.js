/*module.exports = {
    port: 3001,
    protocol: "http",
    nodeConfigurationFile: "../examples/auto-discovery/configuration.js",
    dataDirectory: "../thing-it-data",
    usersDirectory: "../thing-it-users",
    simulated: true,
    proxy: "local",
    verifyCallSignature: false,
    //publicKeyFile: "",
    //signingAlgorithm: "RSA-SHA256",
    authentication: "none",//"user",
    logLevel: "debug"
};*/

module.exports = {
    port: 3001,
    protocol: "http",
    uuid: "e6725c30-24f5-11e5-a703-a976e98e367f",
    proxy: "http://localhost:3000",
    nodeConfigurationFile: "/Users/marcgille/git/thing-it-node/examples/temporary/configuration.js",
    logLevel: "debug",
    simulated: true
};