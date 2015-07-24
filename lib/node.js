module.exports = {
    plugins: function () {
        var nodeManager = new NodeManager();

        return nodeManager.loadPlugins()
    },
    bootstrap: function (options, app, io, server) {
        return new NodeManager().bootstrapNode(options, app, io, server);
    }
};

var utils = require("./utils");
var discovery = require("./discovery");
var device = require("./device");
var storyboard = require("./storyboard");
var job = require("./job");
var eventProcessor = require("./eventProcessor");
var data = require("./data");
var fs = require("fs");
var socketio = require('socket.io-client');
var path = require("path");
var q = require('q');
var crypto = require('crypto');
var http = require('http');

/**
 *
 * @constructor
 */
function NodeManager() {
    /**
     *
     */
    NodeManager.prototype.bootstrapNode = function (options, app, io) {
        this.options = options;

        this.loadPlugins();

        if (!options.proxy || options.proxy == "local") {
            if (options.nodeConfigurationFile) {
                this.state = "configured";
                this.node = this.loadNodeConfiguration(options.nodeConfigurationFile);

                utils.inheritMethods(this.node, new Node());

                this.node.initialize(this.devicePlugins, options.simulated);
                this.node.start();
            }
            else {
                this.state = "unconfigured";
                this.node = new Node();

                this.node.initialize(this.devicePlugins, options.simulated);
            }
        }
        else {
            if (this.existsNodeConfiguration(options.nodeConfigurationFile)) {
                this.state = "configured";
                this.node = this.loadNodeConfiguration(options.nodeConfigurationFile);

                utils.inheritMethods(this.node, new Node());

                this.node.initialize(this.devicePlugins, options.simulated);
                // this.node.start();

                //console
                //    .log("\nNode started in proxy mode against server " + options.proxy + " with previously pushed configuration.");
            }
            else {
                this.state = "unconfigured";
                this.node = new Node();

                this.node.initialize(this.devicePlugins, options.simulated);

                console
                    .log("\nNode started in proxy mode against server " + options.proxy + ". Configuration push required.");
            }
        }

        this.initializeCommunication(options, app, io, "");

        return this;
    };

    /**
     *
     * @param nodeConfigurationFile
     * @returns {*}
     */
    NodeManager.prototype.existsNodeConfiguration = function (nodeConfigurationFile) {
        try {
            return fs.statSync(nodeConfigurationFile) != null;
        }
        catch (error) {
            return false;
        }
    }

    /**
     *
     * @returns
     */
    NodeManager.prototype.loadNodeConfiguration = function (nodeConfigurationFile) {
        try {
            if (nodeConfigurationFile.indexOf(".js", nodeConfigurationFile.length
                    - ".js".length) !== -1) {
                // Assuming that configuration file is a nodejs module and exports
                // the node configuration

                return require(nodeConfigurationFile);
            } else {
                return JSON.parse(fs.readFileSync(nodeConfigurationFile, {
                    encoding: "utf-8"
                }));
            }
        } catch (error) {
            console.log(error);
            throw "Cannot read node configuration from file "
            + nodeConfigurationFile + ".";
        }
    }

    /**
     *
     * @param node
     */
    NodeManager.prototype.saveNodeConfiguration = function (file, node) {
        this.node.lastConfigurationTimestamp = new Date()
            .getTime();
        this.configuration = JSON.parse(JSON.stringify(this.node));

        fs.writeFileSync(file, "module.exports = " + JSON.stringify(node) + ";", {
            encoding: "utf-8"
        });
    }

    /**
     *
     */
    NodeManager.prototype.loadPlugins = function () {
        this.devicePlugins = {};
        this.plugins = this.devicePlugins;
        this.unitPlugins = {};

        this.scanDevicePluginDirectories(__dirname
            + "/default-devices", "/lib/default-devices");
        this.scanDevicePluginDirectories(__dirname
            + "/../node_modules", "/node_modules");

        // Collect units

        this.scanUnitPluginDirectories(__dirname
            + "/default-units", "/lib/default-units");

        // TODO Scan modules

        // Resolve Unit Inheritance

        for (var n in this.unitPlugins) {
            var subUnit = this.unitPlugins[n];

            if (subUnit.superUnit) {
                this.inheritFromSuperUnit(subUnit, unitPlugins[subUnit.superUnit]);
            }
        }

        // Resolve Device Inheritance

        for (var n in this.devicePlugins) {
            var subDevice = this.devicePlugins[n];

            if (subDevice.superDevice) {
                this.inheritFromSuperDevice(subDevice,
                    this.devicePlugins[subDevice.superDevice]);
            }
        }

        return this.devicePlugins;
    };

    /**
     *
     * @param devicePlugins
     * @param plugins
     * @param directory
     */
    NodeManager.prototype.scanDevicePluginDirectories = function (directory, loadDirectory) {
        console.log("===> Scanning directory [" + directory + "] for Device Plugins:");

        var list = fs.readdirSync(directory);

        for (var n in list) {
            var dirStat = fs.statSync(directory + "/" + list[n]);

            if (dirStat && dirStat.isDirectory()
                && list[n].indexOf("thing-it-device-") == 0) {
                console.log("\tProcessing Device Plugin Directory [" + list[n] + "]:");

                var devicePrefix = list[n].substring("thing-it-device-".length);
                var pluginFiles = fs.readdirSync(directory + "/" + list[n]);

                for (var m in pluginFiles) {
                    var pluginFilePath = directory + "/" + list[n] + "/"
                        + pluginFiles[m];
                    var fileStat = fs.statSync(pluginFilePath);

                    if (fileStat && fileStat.isFile()) {
                        // Skip all non .js files

                        if (!utils.hasSuffix(pluginFilePath, ".js")) {
                            continue;
                        }

                        var pluginModulePath = pluginFilePath.substring(0,
                            pluginFilePath.indexOf(".js"));
                        var pluginId = pluginFiles[m].substring(0, pluginFiles[m]
                            .indexOf(".js"));
                        var devicePath = devicePrefix + "/" + pluginId;

                        console.log("\t\tLoading Device Plugin [" + devicePath + "].");

                        try {
                            var devicePlugin = require(pluginModulePath).metadata;

                            devicePlugin.module = devicePrefix;
                            devicePlugin.path = devicePath;
                            devicePlugin.modulePath = pluginModulePath;
                            devicePlugin.pluginDirectory = loadDirectory + "/" + list[n];

                            this.devicePlugins[devicePath] = devicePlugin;
                        } catch (x) {
                            console.log("Failed to load plugin [" + devicePath
                                + "]:");
                            console.log(x);
                        }
                    }
                }

                // Load Default Units

                this.loadUnitPlugins(directory + "/"
                    + list[n] + "/default-units", devicePrefix, loadDirectory + "/" + list[n]);
            }
        }
    };

    /**
     *
     * @param unitPlugins
     * @param directory
     */
    NodeManager.prototype.scanUnitPluginDirectories = function (directory, loadDirectory) {
        console.log("===> Scanning directory [" + directory + "] for Unit Plugins:");

        var list = fs.readdirSync(directory);

        for (var n in list) {
            var dirStat = fs.statSync(directory + "/" + list[n]);

            if (dirStat && dirStat.isDirectory()
                && list[n].indexOf("thing-it-unit-") == 0) {
                var unitPrefix = list[n].substring("thing-it-unit-".length);

                this.loadUnitPlugins(directory + "/"
                    + list[n], unitPrefix, loadDirectory + "/" + list[n]);
            }
        }
    };

    /**
     *
     * @param devicePlugins
     * @param unitPlugins
     * @param directory
     * @param unitPrefix
     */
    NodeManager.prototype.loadUnitPlugins = function (directory, unitPrefix, pluginDirectory) {
        if (!fs.existsSync(directory)) {
            return;
        }

        var pluginFiles = fs.readdirSync(directory);

        for (var m in pluginFiles) {
            var pluginFilePath = directory + "/" + pluginFiles[m];
            var fileStat = fs.statSync(pluginFilePath);

            if (fileStat && fileStat.isFile()) {
                var pluginModulePath = pluginFilePath.substring(0, pluginFilePath
                    .indexOf(".js"));
                var pluginId = pluginFiles[m].substring(0, pluginFiles[m]
                    .indexOf(".js"));
                var unitPath = unitPrefix + "/" + pluginId;

                console.log("Loading Unit Plugin [" + unitPath + "].");

                try {
                    var unitPlugin = require(directory + "/" + pluginId).metadata;

                    unitPlugin.modulePath = pluginModulePath;
                    unitPlugin.path = unitPath;
                    unitPlugin.pluginDirectory = pluginDirectory;

                    this.unitPlugins[unitPath] = unitPlugin;

                    // Add Unit to Device Types

                    for (var l in unitPlugin.deviceTypes) {
                        if (unitPlugin.role == "actor") {
                            this.devicePlugins[unitPlugin.deviceTypes[l]].actorTypes
                                .push(unitPlugin);
                        } else if (unitPlugin.role == "sensor") {
                            this.devicePlugins[unitPlugin.deviceTypes[l]].sensorTypes
                                .push(unitPlugin);
                        } else {
                            throw "No role defined for Unit " + unitPath + ".";
                        }
                    }
                } catch (x) {
                    console.log("Failed to load Unit Plugin [" + unitPath + "]:");
                    console.log(x);
                }
            }
        }
    };

    /**
     *
     * @param array
     * @param field
     * @param value
     * @returns {Boolean}
     */
    NodeManager.prototype.containsElementWithFieldValue = function (array, field, value) {
        for (var n in array) {
            if (array[n][field] == value) {
                return true;
            }
        }

        return false;
    };

    /**
     *
     * @param subUnit
     * @param superUnit
     */
    NodeManager.prototype.inheritFromSuperUnit = function (subUnit, superUnit) {
        for (var n in superUnit.configuration) {
            if (!this.containsElementWithFieldValue(subUnit.configuration, "id",
                    superUnit.configuration[n].id)) {
                subUnit.configuration.push(superUnit.configuration[n]);
            }
        }

        for (var n in superUnit.state) {
            if (!this.containsElementWithFieldValue(subUnit.state, "id",
                    superUnit.state[n].id)) {
                subUnit.state.push(superUnit.state[n]);
            }
        }

        if (subUnit.role == "actor") {
            for (var n in superUnit.services) {
                if (!this.containsElementWithFieldValue(subUnit.services, "id",
                        superUnit.services[n].id)) {
                    subUnit.services.push(superUnit.services[n]);
                }
            }
        }
    };

    /**
     *
     * @param subDevice
     * @param superDevice
     */
    NodeManager.prototype.inheritFromSuperDevice = function (subDevice, superDevice) {
        // Inherit Types

        for (var n in superDevice.dataTypes) {
            if (!subDevice.dataTypes[n]) {
                subDevice.dataTypes[n] = superDevice.dataTypes[n];
            }
        }

        // Inherit Actor Types

        for (var n in superDevice.actorTypes) {
            if (!this.containsElementWithFieldValue(subDevice.actorTypes, "plugin",
                    superDevice.actorTypes[n].plugin)) {
                subDevice.actorTypes.push(superDevice.actorTypes[n]);
            }
        }

        // Inherit Sensor Types

        for (var n in superDevice.sensorTypes) {
            if (!this.containsElementWithFieldValue(subDevice.sensorTypes, "plugin",
                    superDevice.sensorTypes[n].plugin)) {
                subDevice.sensorTypes.push(superDevice.sensorTypes[n]);
            }
        }
    };

    /**
     *
     */
    NodeManager.prototype.initializeCommunication = function (options, app, io) {
        this.initializeCommunicationBasis(options, app, io)

        if (this.options.proxy && this.options.proxy !== "local") {
            this.initializeReverseProxy();
        } else {
            this.initializeWebSocket();

            if (!this.options.omitRestServices) {
                this.initializeSecurityConfiguration();
                this.initializeRestServices();
            }
        }
    };

    /**
     *
     */
    NodeManager.prototype.initializeCommunicationBasis = function (options, app, io) {
        this.options = options;
        this.app = app;
        this.io = io;
        this.uuid = options.uuid;
        this.namespacePrefix = this.options.namespacePrefix ? this.options.namespacePrefix : "";
    };

    /**
     *
     */
    NodeManager.prototype.initializeSecurityConfiguration = function () {
        if (this.options.verifyCallSignature) {
            if (!this.options.publicKeyFile) {
                throw "No Public Key File defined. Please define in option [publicKeyFile] or set option [verifyCallSignature] to [false].";
            }

            try {
                this.publicKey = fs.readFileSync(this.options.publicKeyFile);
            } catch (x) {
                throw "Cannot read Public Key File"
                + configuration.publicKeyFile + ": " + x;
            }

            if (!this.options.signingAlgorithm) {
                throw "No Signing Algorithm defined. Set [verifyCallSignature] to [false].";
            }
        }
    };

    /**
     *
     */
    NodeManager.prototype.initializeRestServices = function () {
        console.log("Initialize REST API for server.");

        this.app.get("/settings", function (req, res) {
            res.send({
                server: "local",
                authentication: this.options.authentication
            });
        }.bind(this));
        this.app.post("/login", function (req, res) {
            if (this.options.authentication === "none") {
                res.send({});
            }
            else if (this.options.authentication === "password") {
                if (req.body.password == this.options.authentication.password) {
                    res.send({});
                }
                else {
                    res.status(500).send("Failed login.");
                }
            } else if (this.options.authentication === "user") {
                // Replace by login

                this.getUser(req.body.account).then(function (user) {
                    res.send(user);
                }.bind(this)).fail(function (error) {
                    if (req.body.account == "root") {
                        var user = {
                            account: "root",
                            password: "root",
                            firstName: "Root",
                            lastName: "User",
                            roleEntitlements: [{
                                type: "role",
                                id: "administrator",
                                label: "Administrator",
                                granted: true
                            }]
                        };

                        this.node.createEntitlementsForUser(user);

                        this.node.createOrUpdateUser(user).then(function (user) {
                            res.send(user);
                        }.bind(this)).fail(function (error) {
                            console.trace(error);

                            res.status(404).send("Failed login.");

                        }.bind(this));
                    }
                    else {
                        console.trace(error);

                        res.status(404).send("Failed login.");
                    }
                }.bind(this));
            } else {
                res.status(500).send("Unknown authentication method.");
            }
        }.bind(this));
        this.app.post("/logout", function (req, res) {
            res.send(req.body);
        });
        this.app.get("/plugins", function (req, res) {
            this.verifyCallSignature(req, res, function () {
                res.send(this.node.plugins);
            }.bind(this));
        }.bind(this));
        this.app.get("/state", function (req, res) {
            this.verifyCallSignature(req, res, function () {
                res.send(this.getState());
            }.bind(this));
        }.bind(this));
        this.app.get("/configuration", function (req, res) {
            this.verifyCallSignature(req, res, function () {
                // Send the plain configuration

                res.send(this.node.clientCopy());
            }.bind(this));
        }.bind(this));
        this.app
            .post(
            "/configure",
            function (req, res) {
                this
                    .verifyCallSignature(
                    req,
                    res,
                    function () {
                        this.configure(req.body);
                        res.send("");
                    }.bind(this));
            }.bind(this));
        this.app.post("/start", function (req, res) {
            this.verifyCallSignature(req, res, function () {
                if (this.state == "configured") {
                    this.node.start().then(function () {
                        this.state = "running";

                        res.send("");
                    }.bind(this)).fail(function (error) {
                        res.status(500).send(error);
                    });
                } else {
                    res.status(500).send("Node is not configured.");
                }
            }.bind(this));
        }.bind(this));
        this.app.post("/stop", function (req, res) {
            this.verifyCallSignature(req, res, function () {
                // TODO Deferred?

                this.node.stop();

                this.state = "configured";

                res.send("");
            });
        }.bind(this));
        this.app.post("/poll", function (req, res) {
            this.verifyCallSignature(req, res, function () {
                this.node.poll();
                res.send("");
            }.bind(this));
        }.bind(this));
        this.app.post("/service/:service", function (req, res) {
            if (!this.node[req.params.service]) {
                res.status(500)
                    .send("Service does not exist");
            }
            else {
                try {
                    if (!req.body || !req.body.parameters) {
                        this.node[req.params.service]
                        ();
                    }
                    else {
                        this.node[req.params.service]
                        (req.body.parameters);
                    }

                    res
                        .send("");
                }
                catch (error) {
                    console.error(error);

                    res.status(500)
                        .send(error);
                }
            }
        }.bind(this));
        this.app.post("/device/:device/service/:service", function (req, res) {
            try {
                // TODO Inhomogenous with node services

                this.node[req.params.device][req.params.service](req.body);

                res.send("");
            } catch (error) {
                console.error(error);

                res.status(500)
                    .send(error);
            }
        }.bind(this));
        this.app.post("/device/:device/actor/:actor/service/:service", function (req, res) {
            try {
                // TODO Inhomogenous with node services

                this.node[req.params.device][req.params.actor][req.params.service](req.body);

                res.send("");
            } catch (error) {
                console.error(error);

                res.status(500)
                    .send(error);
            }
        }.bind(this));
        this.app.get("/devices/:device/streams/:stream", function (req, res) {
            if (!req.params.device) {
                res.end("Streaming resource undefined.");
            }
            else {
                this.findDevice(req.params.device).pipeStream(req, res, req.params.stream);
            }
        }.bind(this));
        this.app.post("/devices/:device/register", function (req, res) {
            if (!req.params.device) {
                res.status(500).end("Device undefined.");
            }
            else {
                if (!this.pendingDeviceRegistrations[req.params.device]) {
                    res.status(500).end("No Device [" + req.params.device + "] pending for registration.");
                }
                else {
                    var newDevice = this.node.pendingDeviceRegistrations[req.params.device];

                    delete this.node.pendingDeviceRegistrations[req.params.device]

                    var index = utils.getNextIdIndex(this.node.devices, device.plugin, 1);

                    newDevice.id = newDevice.__type.plugin + index;
                    newDevice.label = newDevice.__type.label + " " + index;

                    this.node.devices.push(newDevice);

                    device.bind(this.node, newDevice);
                    newDevice.start();

                    res.send(this.node.clientCopy());
                }
            }
        }.bind(this));
        this.app.post("/devices/:device/discard", function (req, res) {
            if (!req.params.device) {
                res.status(500).end("Device undefined.");
            }
            else {
                if (!this.node.pendingDeviceRegistrations[req.params.device]) {
                    res.status(500).end("No Device [" + req.params.device + "] pending for registration.");
                }
                else {
                    delete this.node.pendingDeviceRegistrations[req.params.device]

                    res.send("");
                }
            }
        }.bind(this));
        this.app.get("/users", function (request, response) {
            // TODO To NodeManager

            this.node.getUsers().then(function (users) {
                response.send({users: users});
            }.bind(this)).fail(function (error) {
                console.trace(error);
                response.status(500).send(error);
            }.bind(this));
        }.bind(this));
        this.app.post("/users", function (request, response) {
            if (!request.body.entitlements) {
                request.body.entitlements = [{
                    type: "role",
                    id: "administrator",
                    label: "Administrator",
                    granted: false
                }]
                ;
            }

            //this.createEntitlementForUser(request.body);

            this.node.createOrUpdateUser(request.body).then(function (user) {
                response.send(user);
            }.bind(this)).fail(function (error) {
                console.trace(error);
                response.status(500).send(error);
            }.bind(this));
        }.bind(this));
        this.app.put("/users/:user", function (request, response) {
            this.node.createOrUpdateUser(request.body).then(function (user) {
                response.send(user);
            }.bind(this)).fail(function (error) {
                console.trace(error);
                response.status(500).send(error);
            }.bind(this));
        }.bind(this));
    };

    /**
     *
     */
    NodeManager.prototype.initializeWebSocket = function () {
        console.log("Initializing Web Socket for event dispatching at " + this.namespacePrefix + "/events");

        // Open namespace for web socket connections

        this.namespace = this.io.of(this.namespacePrefix + "/events");
        this.node.namespace = this.namespace;

        this.namespace.on("connection",
            function (socket) {
                console.log("Websocket connection established for Node ["
                    + this.node.id + "] at " + this.namespacePrefix + "/events.");
            }.bind(this));
        this.namespace.on("disconnect", function (socket) {
            console
                .log("Websocket connection disconnected for Node ["
                + this.node.id + "] at " + this.namespacePrefix + "/events.");
        }.bind(this));
    };

    /**
     *
     */
    NodeManager.prototype.initializeReverseProxy = function () {
        console.log("Initialize Reverse Proxy");

        var reverseProxyNamespaceUrl = this.options.proxy + "/reverse-proxy/nodes/" + this.uuid;

        this.connectInterval = setInterval(function () {
            console.debug("(Re)try initial NS connection for " + reverseProxyNamespaceUrl);

            // SocketIO reconnect semantics seem not to work as we need them

            this.reverseProxyNamespace = socketio.connect(reverseProxyNamespaceUrl, {
                //reconnection: true,
                //reconnectionAttempts: "Infinity",
                //reconnectionDelay: 5000,
                //reconnectionDelayMax: 5000,
                //randomizationFactor: 0
                reconnection: false,
                "force new connection": true
            });

            this.node.reverseProxyNamespace = this.reverseProxyNamespace;

            this.reverseProxyNamespace.on("connect", function () {
                console.debug("Reverse Proxy connected.");

                clearInterval(this.connectInterval);

                setInterval(function () {
                    this.reverseProxyNamespace.emit("connectionTest", {test: "bla"});
                }.bind(this), 10000);
            }.bind(this));
            this.reverseProxyNamespace.on("disconnect", function (socket) {
                console.debug("Reverse Proxy disconnected");

                clearInterval(this.connectInterval);
                this.initializeReverseProxy();
            }.bind(this));
            this.reverseProxyNamespace.on("httpRequest", function (request) {
                console.debug("Received Reverse Proxy HTTP Request: " + request.path);
                console.debug("Method: " + request.method);
                console.debug("Path  : " + request.path);
                console.debug("Body  : ", request.body);

                // Mini middleware

                try {
                    var details = null;

                    if (details = this.matchRequestPath(request.path, "/plugins")) {
                        this.reverseProxyNamespace.emit("httpResponseData", {data: this.devicePlugins});
                        this.reverseProxyNamespace.emit("httpResponseEnd", {status: 0});
                        console.log("<<<", {data: this.devicePlugins});
                    }
                    else if (details = this.matchRequestPath(request.path, "/state")) {
                        this.reverseProxyNamespace.emit("httpResponseData", {
                            status: 0, data: this.getState()
                        });
                        this.reverseProxyNamespace.emit("httpResponseEnd", {status: 0});
                        console.log("<<<", {
                            status: 0, data: this.getState()
                        });
                    }
                    else if (details = this.matchRequestPath(request.path, "/configuration")) {
                        this.reverseProxyNamespace.emit("httpResponseData", {
                            data: {
                                status: 0, data: {
                                    state: this.state,
                                    configuration: this.node.clientCopy()
                                }
                            }
                        });
                        this.reverseProxyNamespace.emit("httpResponseEnd", {status: 0});
                    }
                    else if (details = this.matchRequestPath(request.path, "/poll")) {
                        this.node.poll();
                        this.reverseProxyNamespace.emit("httpResponseEnd", {status: 0});
                    }
                    else if (details = this.matchRequestPath(request.path, "/configure")) {
                        this.configure(request.body);
                        this.reverseProxyNamespace.emit("httpResponseEnd", {status: 0});
                    }
                    else if (details = this.matchRequestPath(request.path, "/start")) {
                        // TODO Encapsulate

                        this.node.start().then(function () {
                            this.state = "running";

                            this.reverseProxyNamespace.emit("httpResponseEnd", {status: 0});
                        }.bind(this)).fail(function (error) {
                            this.reverseProxyNamespace.emit("httpResponseError", {status: 500, error: error});
                        }.bind(this));
                    }
                    else if (details = this.matchRequestPath(request.path, "/stop")) {
                        // TODO Encapsulate

                        this.node.stop();
                        this.state = "configured";

                        this.reverseProxyNamespace.emit("httpResponseEnd", {status: 0});
                    }
                    else if (details = this.matchRequestPath(request.path, "/devices/:device/streams/:stream")) {
                        this.reverseProxyNamespace.emit("httpResponseEnd", {status: 0});
                    }
                    else if (details = this.matchRequestPath(request.path, "/devices/:device/register")) {
                        this.reverseProxyNamespace.emit("httpResponseEnd", {status: 0});
                    }
                    else if (details = this.matchRequestPath(request.path, "/devices/:device/discard")) {
                        this.reverseProxyNamespace.emit("httpResponseEnd", {status: 0});
                    }
                    else if (details = this.matchRequestPath(request.path, "/services/:service")) {
                        if (!this.node[details.params.service]) {
                            this.reverseProxyNamespace.emit("httpResponseError", {
                                status: 500,
                                error: "Service [" + details.params.service + "] does not exist"
                            });
                        }
                        else {
                            try {
                                if (!request.body || !request.body.parameters) {
                                    this.node[details.params.service]
                                    ();
                                }
                                else {
                                    this.node[details.params.service]
                                    (request.body.parameters);
                                }

                                this.reverseProxyNamespace.emit("httpResponseEnd", {status: 0});
                            }
                            catch (error) {
                                console.error(error);

                                this.reverseProxyNamespace.emit("httpResponseError", {status: 500, error: error});
                            }
                        }
                    }
                    else if (details = this.matchRequestPath(request.path, "/devices/:device/services/:service")) {
                        try {
                            // TODO Inhomogenous with node services

                            this.node[details.params.device][details.params.service](request.body);

                            this.reverseProxyNamespace.emit("httpResponseEnd", {status: 0});
                        } catch (error) {
                            console.error(error);

                            this.reverseProxyNamespace.emit("httpResponseError", {status: 500, error: error});
                        }
                    }
                    else if (details = this.matchRequestPath(request.path, "/devices/:device/actors/:actor/services/:service")) {
                        try {
                            // TODO Inhomogenous with node services

                            this.node[details.params.device][details.params.actor][details.params.service](request.body);

                            this.reverseProxyNamespace.emit("httpResponseEnd", {status: 0});
                        } catch (error) {
                            console.error(error);

                            this.reverseProxyNamespace.emit("httpResponseError", {status: 500, error: error});
                        }
                    }
                    else if (details = this.matchRequestPath(request.path, "/data/:data")) {
                        //res
                        //    .send(this[req.params.data]);

                        this.reverseProxyNamespace.emit("httpResponseEnd", {status: 0});
                    }
                    else {
                        console.error("Unsupported request path " + request.path);

                        this.reverseProxyNamespace.emit("httpResponseError", {
                            status: 500,
                            error: "Unsupported request path " + request.path
                        });
                    }
                }
                catch
                    (error) {
                    console.error(error);

                    try {
                        console.error("Return error response.");

                        this.reverseProxyNamespace.emit("httpResponseError", {status: 500, error: error});
                    }
                    catch (error) {
                        console.error(error);
                    }
                }
            }.bind(this));
        }.bind(this), 10000);
    };

    /**
     *
     */
    NodeManager.prototype.matchRequestPath = function (path, pattern) {
        var pathSegments = path.split("/");
        var patternSegments = pattern.split("/");

        if (pathSegments.length != patternSegments.length) {
            return null;
        }

        var details = {params: {}, query: {}};

        // [0] is ""

        for (var n = 1; n < pathSegments.length; ++n) {
            if (patternSegments[n].indexOf(":") == 0) {
                details.params[patternSegments[n].substring(1)] = pathSegments[n];
            }
            else if (patternSegments[n] !== pathSegments[n]) {
                return null;
            }
        }

        return details;
    };

    /**
     *
     * @param node
     */
    NodeManager.prototype.getState = function () {
        return {
            state: this.state,
            lastConfigurationTimestamp: this.node ? this.node.lastConfigurationTimestamp : null
        }
    };

    /**
     * TODO Block calls during configuration
     */
    NodeManager.prototype.configure = function (node) {
        if (this.state === "running") {
            this.node.stop();
        }

        this.node = node;
        this.node.lastConfigurationTimestamp = new Date().getTime();

        if (this.options.nodeConfigurationFile) {
            this.saveNodeConfiguration(this.options.nodeConfigurationFile, this.node);
        }

        utils.inheritMethods(this.node,
            new Node());

        this.node.initialize(this.devicePlugins, this.options.simulated);

        // TODO Needed/correct?

        this.node.namespace = this.namespace;
        this.node.reverseProxyNamespace = this.reverseProxyNamespace;

        this.state = "configured";
    };

    /**
     *
     */
    NodeManager.prototype.verifyCallSignature = function (request, response, callback) {
        if (this.options.verifyCallSignature) {
            var verify = crypto.createVerify(this.options.signingAlgorithm);
            var data = request.body == null ? "" : JSON.stringify(request.body);

            verify.update(request.url + request.method + data);

            if (!request.header.Signature
                || !verify.verify(this.publicKey, request.header.Signature,
                    'hex')) {
                res.status(404).send("Signature verification failed");
            } else {
                callback();
            }
        } else {
            callback();
        }
    };
}

/**
 *
 */
function Node() {
    /**
     *
     */
    Node.prototype.initialize = function (plugins, simulated) {
        this.plugins = plugins;

        // Configuration can overwrite the node settings

        if (this.simulated == null) {
            this.simulated = simulated;
        }

        // TODO To NodeManager?

        this.pendingDeviceRegistrations = {};
    }

    /**
     *
     * @returns {{id: *, label: *, devices: Array, services: Array, groups: Array, data: Array}}
     */
    Node.prototype.clientCopy = function () {
        var copy = {
            id: this.id,
            label: this.label,
            devices: [],
            services: [],
            groups: [],
            data: []
        };

        for (var n in this.devices) {
            copy.devices.push(this.devices[n].clientCopy());
        }

        for (var n in this.groups) {
            copy.groups.push(this.clientCopyGroup(this.groups[n]));
        }

        for (var n in this.services) {
            copy.services.push({
                id: this.services[n].id, label: this.services[n].label,
                parameters: this.services[n].parameters
            });
        }

        for (var n in this.data) {
            copy.data.push(this.data[n].clientCopy());
        }

        return copy;
    };

    Node.prototype.clientCopyGroup = function (group) {
        var copy = {
            id: group.id,
            label: group.label, icon: group.icon,
            devices: group.devices,
            actors: group.actors,
            sensors: group.sensors,
            subGroups: []
        };

        for (var n in group.subGroups) {
            copy.subGroups.push(this.clientCopyGroup(group.subGroups[n]));
        }

        return copy;
    };

    /**
     *
     */
    Node.prototype.start = function () {
        var deferred = q.defer();

        console.log("Starting Node [" + this.label + "].");

        // Start auto-discovery

        if (this.autoDiscoveryDeviceTypes) {
            for (var n = 0; n < this.autoDiscoveryDeviceTypes.length; ++n) {
                var deviceDiscovery = discovery.create(this, this.autoDiscoveryDeviceTypes[n]);

                deviceDiscovery.start();
            }
        }

        console.log("\tAuto-Discovery started.");

        // TODO Bind before namespace initialization?
        // TODO Need a bind function

        // Bind Devices

        for (var n = 0; n < this.devices.length; ++n) {
            device.bind(this, this.devices[n]);
        }

        // Bind Services

        for (var n in this.services) {
            if (this.services[n].content.type == "storyboard") {
                storyboard.bind(this, this.services[n]);
            } else {
                // TODO Move to object/bind

                try {
                    // TODO Very ugly, could be solved by externalizing Node
                    // Services
                    // into a class

                    this.services[n].content.script = this.preprocessScript(this.services[n].content.script);

                    this[this.services[n].id] = new Function('input',
                        "this.executeScript(\""
                        + this.services[n].content.script + "\");");

                    console.log("\tService [" + this.services[n].id
                        + "] available.");
                } catch (x) {
                    console.log("\tFailed to initialize Service ["
                        + this.services[n].id + "]:");
                    console.log(x);
                }
            }
        }

        console.log("\tServices bound.");

        // Bind Jobs

        if (this.jobs) {
            for (var n in this.jobs) {
                job.bind(this, this.jobs[n]);
            }
        }

        console.log("\Jobs bound.");

        // Bind Data

        if (!this.data) {
            this.data = [];
        }

        for (var n = 0; n < this.data.length; ++n) {
            data.bind(this, this.data[n]);
        }

        console.log("\tData bound.");

        utils
            .promiseSequence(this.data, 0, "start")
            .then(
            function () {
                console.log("\tData started.");

                // Start Devices

                utils
                    .promiseSequence(this.devices, 0, "startDevice")
                    .then(
                    function () {
                        console.log("\tDevices started.");

                        try {
                            // Event Processors

                            for (var n = 0; n < this.eventProcessors.length; ++n) {
                                eventProcessor
                                    .create(
                                    this,
                                    this.eventProcessors[n])
                                    .start();
                            }

                            console.log("\tEvent Processors started.");

                            // Activate Jobs

                            if (this.jobs) {
                                for (var n in this.jobs) {
                                    this.jobs[n]
                                        .activate();
                                }
                            }

                            console.log("\tJobs activated.");

                            this.heartbeat = setInterval(
                                function () {
                                    this
                                        .publishHeartbeat();
                                }.bind(this), 10000);

                            this.publishHeartbeat();

                            console.log("Node ["
                                + this.label
                                + "] started.");

                            deferred.resolve();
                        } catch (x) {
                            console.error(x);

                            deferred.reject(x);
                        }

                    }.bind(this));
            }.bind(this));

        return deferred.promise;
    };

    /**
     *
     */
    Node.prototype.isSimulated = function () {
        return this.simulated;
    };

    /**
     *
     */
    Node.prototype.findDevice = function (id) {
        for (var n = 0; n < this.devices.length; ++n) {
            if (this.devices[n].id == id) {
                return this.devices[n];
            }
        }

        throw "No device with ID " + id + ".";
    };

    /**
     *
     */
    Node.prototype.poll = function () {
        for (var n in this.devices) {
            this.devices[n].publishStateChange();

            for (var m in this.devices[n].actors) {
                this.devices[n].actors[m].publishStateChange();
            }
        }
    };

    /**
     *
     */
    Node.prototype.stop = function () {
        console.log("Stopping Node [" + this.label + "].");

        for (var n = 0; n < this.devices.length; ++n) {
            this.devices[n].stop();
        }

        if (this.heartbeat) {
            clearInterval(this.heartbeat);
        }

        console.log("Stopped Node [" + this.label + "].");
    };

    /**
     *
     */
    Node.prototype.publishMessage = function (message) {
        if (this.namespace) {
            this.namespace.emit("message", message);
        }

        if (this.reverseProxyNamespace) {
            this.reverseProxyNamespace.emit("message", message);
        }
    };

    /**
     *
     */
    Node.prototype.publishEvent = function (event) {
        if (this.namespace) {
            this.namespace.emit("event", event);
        }

        if (this.reverseProxyNamespace) {
            this.reverseProxyNamespace.emit("event", event);
        }
    };

    /**
     *
     */
    Node.prototype.publishHeartbeat = function (details) {
        if (this.namespace) {
            this.namespace.emit("heartbeat", details);
        }

        if (this.reverseProxyNamespace) {
            this.reverseProxyNamespace.emit("heartbeat", details);
        }
    };

    /**
     *
     */
    Node.prototype.publishDeviceStateChange = function (device, state) {
        if (this.namespace) {
            this.namespace.emit("deviceStateChange", {
                device: device.id,
                state: state
            });
        }

        if (this.reverseProxyNamespace) {
            this.reverseProxyNamespace.emit("deviceStateChange", {
                device: device.id,
                state: state
            });
        }
    };

    /**
     *
     */
    Node.prototype.publishActorStateChange = function (device, actor, state) {
        try {
            if (this.namespace) {
                this.namespace.emit("actorStateChange", {
                    device: device.id,
                    actor: actor.id,
                    state: state
                });
            }

            if (this.reverseProxyNamespace) {
                this.reverseProxyNamespace.emit("actorStateChange", {
                    device: device.id,
                    actor: actor.id,
                    state: state
                });
            }
        }
        catch (error) {
            console.log(error);
        }
    };

    /**
     *
     */
    Node.prototype.publishDeviceAdvertisement = function (device) {
        try {
            if (this.namespace) {
                this.namespace.emit("deviceAdvertisement", {
                    uuid: device.uuid,
                    label: device.label
                });
            }

            if (this.reverseProxyNamespace) {
                this.reverseProxyNamespace.emit("deviceAdvertisement", {
                    uuid: device.uuid,
                    label: device.label
                });
            }
        }
        catch (error) {
            console.log(error);
        }
    };

    /**
     *
     */
    Node.prototype.publishDeviceRegistration = function (device) {
        try {
            if (this.namespace) {
                this.namespace.emit("deviceRegistration", {
                    device: device.id
                });
            }

            if (this.reverseProxyNamespace) {
                this.reverseProxyNamespace.emit("deviceRegistration", {
                    device: device.id
                });
            }
        }
        catch (error) {
            console.log(error);
        }
    };

    /**
     *
     */
    Node.prototype.callService = function (serviceId) {
        try {
            // TODO Other Service types?

            this.executeScript(this.findService(serviceId).script);
        } catch (x) {
            console.log("Failed to invoke Service [" + serviceId + "]:");
            console.log(x);
        }
    };

    /**
     *
     */
    Node.prototype.findService = function (id) {
        for (var n = 0; n < this.services.length; ++n) {
            if (this.services[n].id == id) {
                return this.services[n];
            }
        }

        throw "No services exists with ID " + id + ".";
    };

    /**
     *
     */
    Node.prototype.executeScript = function (script) {
        with (this) {
            eval(script);
        }

        this.saveData();
    };

    /**
     *
     */
    Node.prototype.preprocessScript = function (script) {
        script.replace("\n", "");
        script.replace('\"', '"');

        console.log("Script", script);

        return script;
    };

    /**
     *
     */
    Node.prototype.saveData = function () {
        for (var n = 0; n < this.data.length; ++n) {
            this.data[n].save();
        }
    };

    /**
     *
     */
    Node.prototype.getUser = function (id) {
        var deferred = q.defer();

        try {
            var user = JSON.parse(fs
                .readFileSync(this.options.usersDirectory + "/"
                + id + ".json"));

            deferred.resolve(user);
        } catch (error) {
            deferred.reject(error);
        }

        return deferred.promise;
    };

    /**
     *
     */
    Node.prototype.getUsers = function () {
        var deferred = q.defer();

        try {
            var list = fs.readdirSync(this.options.usersDirectory);
            var users = [];

            for (var n in list) {
                var dirStat = fs.statSync(this.options.usersDirectory + "/" + list[n]);

                if (dirStat && dirStat.isFile() && list[n].indexOf(".json") > 0) {
                    users.push(JSON.parse(fs
                        .readFileSync(this.options.usersDirectory + "/" + list[n])));
                }
            }

            deferred.resolve(users);
        } catch (error) {
            deferred.reject(error);
        }

        return deferred.promise;
    };

    /**
     *
     */
    Node.prototype.createOrUpdateUser = function (user) {
        var deferred = q.defer();

        try {
            fs
                .writeFileSync(this.options.usersDirectory + "/"
                + user.account + ".json", JSON
                    .stringify(user));

            deferred.resolve(user);
        } catch (error) {
            deferred.reject(error);
        }

        return deferred.promise;
    };

    /**
     *
     * @param entitlements
     * @param group
     */
    Node.prototype.createEntitlementsForUser = function (user) {
        var groupEntitlements = [];

        for (var n in this.groups) {
            groupEntitlements.push(this.createGroupEntitlement(this.groups[n], true));
        }

        for (var n in groupEntitlements) {
            for (var m in user.groupEntitlements) {
                if (groupEntitlements[n].type == "group" && user.groupEntitlements[m].type == "group" && groupEntitlements[n].id == user.groupEntitlements[m].id) {
                    this.reconcileGroupEntitlements(user.groupEntitlements[n], user.groupEntitlements[m])
                }
            }
        }

        user.groupEntitlements = groupEntitlements;

        var deviceEntitlements = [];

        console.log("Before device");
        for (var n in this.devices) {
            console.log("Device", this.devices[n]);
            deviceEntitlements.push(this.createDeviceEntitlement(this.devices[n], true));
        }

        user.deviceEntitlements = deviceEntitlements;
    };

    /**
     *
     * @param entitlements
     * @param group
     */
    Node.prototype.createGroupEntitlement = function (group, topLevel) {
        var entitlement = {
            type: "group",
            id: group.id,
            label: group.label,
            view: topLevel ? false : null,
            execute: topLevel ? false : null,
            deviceEntitlements: [],
            groupEntitlements: []
        };

        if (group.subGroups) {
            for (var n in group.subGroups) {
                entitlement.groupEntitlements.push(this.createGroupEntitlement(group.subGroups[n]));
            }
        }

        return entitlement;
    };

    /**
     *
     * @param entitlements
     * @param actor
     */
    Node.prototype.createDeviceEntitlement = function (device) {
        var entitlement = {
            type: "device",
            label: device.label,
            path: device.id,
            view: false,
            execute: false
        };

        return entitlement;
    };

    /**
     *
     * @param entitlements
     * @param actor
     */
    Node.prototype.createActorEntitlement = function (actor) {
        var entitlement = {
            type: "actor",
            label: actor.__device.label + "/" + actor.label,
            path: actor.__device.id + "." + actor.id
        };

        return entitlement;
    };

    /**
     *
     * @param entitlements
     * @param group
     */
    Node.prototype.reconcileGroupEntitlements = function (newEntitlement, entitlement) {
    };
}