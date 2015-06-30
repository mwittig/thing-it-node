/*module.exports = {
    port: 3001,
    protocol: "http",
    nodeConfigurationFile: "../examples/temporary/configuration.js",
    dataDirectory: "../thing-it-data",
    usersDirectory: "../thing-it-users",
    simulated: true,
    proxy: "local",
    verifyCallSignature: false,
    publicKeyFile: "",
    signingAlgorithm: "RSA-SHA256",
    authentication: "none",//"user",
    logLevel: "debug"
};*/

module.exports = {
    port: 3001,
    protocol: "http",
    uuid: "1c178e30-1cf1-11e5-bbd4-55db91e41791",
    proxy: "http://localhost:3000",
    nodeConfigurationFile: "/Users/marcgille/git/thing-it-node/examples/temporary/configuration.js",
    logLevel: "debug",
    simulated: true
};