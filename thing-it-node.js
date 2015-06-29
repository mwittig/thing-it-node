// Imports

var options = require("./options");
var node = require("./lib/node");
var bodyParser = require('body-parser')
var express = require('express');
var app = express();
var Server = require('socket.io');

// Logging

if (options.logLevel == "debug") {
    console.debug = function (output) {
        console.log(output);
    };
}
else {
    console.debug = function (output) {
    };
}

var io = new Server({
    transports: ["websocket", "htmlfile", "xhr-polling", "jsonp-polling"]
});

app.use(express.static(__dirname + "/phonegap/www"));

// TODO Provide all device plugin pathes

//app.use("/default-devices", express.static(__dirname + "/lib/default-devices"));
//app.use('/examples', express.static(__dirname + '/examples'));
app.use("/", express.static(__dirname + "/"));

app.use(bodyParser.json());
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

var server = app
    .listen(
    options.port,
    function () {
        console.log("\n");
        console
            .log("---------------------------------------------------------------------------");
        console.log(" [thing-it-node] at http://%s:%s", server.address().address, server.address().port);
        console.log("\n");
        console.log(" Proxy                  : %s",
            options.proxy);

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
        else
        {
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
            node.bootstrap(options, app, io, server);
        } catch (x) {
            console.error("Cannot start node: " + x);
            process.exit();
        }
    });
