// Imports

var options = require("./options");
var node = require("./lib/node");
var utils = require("./lib/utils");
var bodyParser = require('body-parser')
var express = require('express');
var app = express();
var Server = require('socket.io');

var io = new Server({
    transports: ["websocket", "htmlfile", "xhr-polling", "jsonp-polling"]
});

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
    res.header("Access-Control-Allow-Headers",
        "accept, origin, content-type, cookie, X-Requested-With, X-HTTP-Method-Override");
    res.header("Access-Control-Allow-Credentials", true);

    if (req.method === 'OPTIONS') {
        // Fulfills pre-flight/promise request

        res.send(200);
    } else {
        next();
    }
});
app.use(express.static(__dirname + "/www"));
app.use("/node_modules", express.static(__dirname + "/node_modules"));
app.use("/files", express.static(options.dataDirectory + "/files")); // TODO Remove
app.use("/data", express.static(options.dataDirectory));
app.use(bodyParser.json());

var server = app
    .listen(
    options.port,
    function () {
        console.log("\n");
        console
            .log("---------------------------------------------------------------------------");
        console.log(" [thing-it-node] at http://%s:%s", server.address().address, server.address().port);
        console.log("\n");

        if (options.proxy == "local") {
            console.log(" Node Configuration File: %s",
                options.nodeConfigurationFile);
            console.log(" Simulated              : %s",
                options.simulated);
            console.log(" Hot Deployment         : %s",
                options.hotDeployment);
            console.log(" Verify Call Signature  : %s",
                options.verifyCallSignature);
            console.log(" Public Key File        : %s",
                options.publicKeyFile);
            console.log(" Signing Algorithm      : %s",
                options.signingAlgorithm);
        }
        else {
            console.log(" UUID                   : %s",
                options.uuid);
        }

        console.log(" Log Level              : %s",
            options.logLevel);
        console.log("\n");
        console
            .log(" Copyright (c) 2014-2015 Marc Gille. All rights reserved.");
        console
            .log("-----------------------------------------------------------------------------");
        console.log("\n");

        try {
            io.listen(server);

            node.bootstrap(options, app, io);
        } catch (x) {
            console.error("Cannot start node: ", x);

            process.exit();
        }
    });
