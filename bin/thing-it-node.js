#!/usr/bin/env node

// Imports

var node = require("../lib/node");
var utils = require("../lib/utils");
var bodyParser = require('body-parser')
var express = require('express');
var app = express();
var Server = require('socket.io');
var fs = require('fs');

require("yargs").usage("tin <command> [options]")
    .help("help", "Print this help")
    .demand(1)
    .command("init", "Create Configurations Directory with an empty Configurations File as well as the Data and User Directories .", init)
    .command("example", "Create an example Node Configurations file from a source.", example)
    .command("run", "Starts the [thing-it-node] Server.", run)
    .alias("h", "help")
    .argv;

function init(yargs) {
    createDirectories();

    var configuration = "module.exports = {label: 'Default', id: 'default', autoDiscoveryDeviceTypes: [";
    var plugins = node.plugins();

    for (var plugin in plugins) {
        if (!plugins[plugin].discoverable) {
            continue;
        }

        configuration += "{plugin: '" + plugin + "', confirmRegistration: true, " +
            "persistRegistration: true, defaultConfiguration: {";

        for (var n in plugins[plugin].configuration) {
            if (plugins[plugin].configuration[n].defaultValue) {
                configuration += plugins[plugin].configuration[n].id + ": ";
                if (plugins[plugin].configuration[n].type.id === "string") {
                    configuration += "'" + plugins[plugin].configuration[n].defaultValue + "'";
                }
                else {
                    configuration += plugins[plugin].configuration[n].defaultValue;
                }

                configuration += ",";
            }
        }

        configuration += "}, options: {";
        configuration += "}},\n";
    }

    configuration += "], devices: [], services: [], eventProcessors: []};";

    fs
        .writeFileSync(process.cwd() + "/configurations/default.js", configuration);
}

/**
 *
 */
function example(yargs) {
    var argv = yargs.option("device", {
        alias: "d",
        description: 'Device Plugin'
    }).option("directory", {
        alias: "f",
        description: 'Examples Directory'
    }).help("help").argv;

    console.log("Initialize [thing-it-node] Configuration File from example.");

    createDirectories();

    var source;
    var target;

    if (argv.device) {
        source = __dirname + "/../node_modules/thing-it-device-" + argv.device + "/examples/configuration.js";
        target = process.cwd() + "/configurations/" + argv.device + ".js";
    } else if (argv.directory) {
        source = __dirname + "/../examples/" + argv.directory + "/configuration.js";
        target = process.cwd() + "/configurations/" + argv.directory + ".js";
    }

    console.log("\nSource      : " + source);
    console.log("Destination : " + target);

    copyFile(source, target);
}

function createDirectories() {
    createDirectory("configurations", "Configurations");
    createDirectory("users", "Users");
    createDirectory("data", "Data");
}

function createDirectory(name, purpose) {
    try {
        fs.mkdirSync(process.cwd() + "/" + name);
    } catch (e) {
        if (e.code == "EEXIST") {
            console.log(purpose + " Directory  [" + process.cwd() + "/" + name + "] already exists");
        } else {
            console.error("Cannot create " + purpose + " Directory [" + process.cwd() + "/" + name + "]: ", e);

            process.exit();
        }
    }
}
function copyFile(source, target) {
    var rd = fs.createReadStream(source);

    rd.on("error", function (err) {
        done(err);
    });

    var wr = fs.createWriteStream(target);

    wr.on("error", function (err) {
        done(err);
    });
    wr.on("close", function (ex) {
        done();
    });
    rd.pipe(wr);

    function done(error) {
    }
}

/**
 *
 */
function run(yargs) {
    var argv = yargs.option("simulate", {
        alias: "s",
        description: 'Activate simulation mode',
        type: "boolean"
    }).help("help").argv;

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
            proxy: "local",
            nodeConfigurationsDirectory: process.cwd() + "/configurations",
            dataDirectory: process.cwd() + "/data",
            usersDirectory: process.cwd() + "/users",
            simulated: true,
            authentication: "none",
            logLevel: "debug"
        }
    }

    // Overwrite file or default options with command line options

    if (argv.simulate != undefined) {
        options.simulated = argv.simulate;
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
    app.use(express.static(__dirname + "/../www"));
    app.use("/node_modules", express.static(__dirname + "/../node_modules"));
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
                console.log(" Protocol                     : %s",
                    options.protocol);
                console.log(" Port                         : %s",
                    options.port);
                console.log(" Node Configurations Directory: %s",
                    options.nodeConfigurationsDirectory);
                console.log(" Simulated                    : %s",
                    options.simulated);
            }
            else {
                console.log(" UUID                         : %s",
                    options.uuid);
                console.log(" Proxy Server                 : %s",
                    options.proxy);
            }

            console.log(" Log Level                    : %s",
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