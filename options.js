module.exports = {
    logLevel: "debug",
    port: 3001,
    protocol: "http",
    nodeConfigurationFile: "../examples/camera-and-microphone/configuration.js",
    dataDirectory: "../thing-it-data",
    simulated: false,
    hotDeployment: false,
    //reverseProxy: "http://www.thing-it.com",
    verifyCallSignature: false,
    publicKeyFile: "",
    signingAlgorithm: "RSA-SHA256",
    authentication: {type: "none"}
};