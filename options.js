module.exports = {
    port: 3001,
    protocol: "http",
    nodeConfigurationFile: "../examples/universal-remote-control/configuration.js",
    dataDirectory: "../thing-it-data",
    simulated: false,
    hotDeployment: false,
    verifyCallSignature: false,
    publicKeyFile: "",
    signingAlgorithm: "RSA-SHA256"
};