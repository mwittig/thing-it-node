module.exports = {
    logLevel: "debug",
    port: 3001,
    protocol: "http",
    nodeConfigurationFile: "../examples/our-things/configuration.js",
    dataDirectory: "../thing-it-data",
    usersDirectory: "../thing-it-users",
    simulated: true,
    hotDeployment: false,
    //reverseProxy: "http://www.thing-it.com",
    verifyCallSignature: false,
    publicKeyFile: "",
    signingAlgorithm: "RSA-SHA256",
    authentication: {type: "none"}
};