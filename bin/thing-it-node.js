#!/usr/bin/env node

// Imports

var node = require("../lib/node");
var utils = require("../lib/utils");
var bodyParser = require('body-parser')
var express = require('express');
var app = express();
var Server = require('socket.io');
var argv = require('yargs').argv;
var fs = require('fs');

if (argv.help) {
    help();
}
else if (argv.init) {
    init();
}
else if (argv.run) {
    run();
}
else {
    run();
}

/**
 *
 */
function help() {
    console.log();
    console.log("NAME");
    console.log("\ttin");
    console.log("SYNOPSIS");
    console.log("\ttin [--help|--init|--run]");
    console.log("OPTIONS");
    console.log("\t--help\tPrints this help page");
    console.log("\t--init\tCreates a sample [thing-it-node] Configuration File");
    console.log("\t--run\tStarts the [thing-it-node] Server");
    console.log();
}

/**
 *
 */
function init() {
    console.log("Initialize empty [thing-it-node] Configuration File.");
}

/**
 *
 */
function run() {
    console.log();

    var options;

    if (fs.existsSync(process.cwd() + "/options.js")) {
        console.log("Running [thing-it-node] from Options File [" + process.cwd() + "/options.js]");

        options = require(process.cwd() + "/options.js");
    }
    else {
        console.log("No options file in start directory [" + process.cwd() + "]. Using defaults.");

        options = {
            port: 3001,
            protocol: "http",
            nodeConfigurationsDirectory: process.cwd() + "/configurations",
            dataDirectory: process.cwd() + "/data",
            usersDirectory: process.cwd() + "/users",
            simulated: true,
            authentication: "none",
            logLevel: "debug"
        }
    }

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
            if (!options.proxy || options.proxy === "local") {
                console.log(" Protocol               : %s",
                    options.protocol);
                console.log(" Port                   : %s",
                    options.port);
                console.log(" Node Configuration File: %s",
                    options.nodeConfigurationFile);
                console.log(" Simulated              : %s",
                    options.simulated);
            }
            else {
                console.log(" UUID                   : %s",
                    options.uuid);
                console.log(" Proxy Server            : %s",
                    options.proxy);
            }

            console.log(" Log Level              : %s",
                options.logLevel);
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
}