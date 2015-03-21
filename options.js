module.exports = {
    port: 3001,
    protocol: "http",
    nodeConfigurationFile: "../examples/camera-and-microphone/configuration.js",
    dataDirectory: "../thing-it-data",
    simulated: true,
    hotDeployment: false,
    verifyCallSignature: false,
    publicKeyFile: "",
    signingAlgorithm: "RSA-SHA256",
    authentication: {type: "none"}
};