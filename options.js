module.exports = {
    logLevel: "debug",
    port: 3001,
    protocol: "http",
    nodeConfigurationFile: "../examples/simple-lighting/configuration.js",
    dataDirectory: "../thing-it-data",
    simulated: true,
    hotDeployment: false,
    reverseProxy: "http://localhost:3000",
    verifyCallSignature: false,
    publicKeyFile: "",
    signingAlgorithm: "RSA-SHA256",
    authentication: {type: "none"}
};