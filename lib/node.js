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
var logger = require("./logger");
var discovery = require("./discovery");
var device = require("./device");
var service = require("./service");
var storyboard = require("./storyboard");
var job = require("./job");
var eventProcessor = require("./eventProcessor");
var data = require("./data");
var fs = require("fs");
var socketio = require('socket.io-client');
var path = require("path");
var q = require('q');
var crypto = require('crypto');
var request = require('request');
var getmac = require('getmac');

/**
 *
 * @constructor
 */
function NodeManager() {
    this.class = "NodeManager";

    utils.inheritMethods(this, logger.create());

    this.HEARTBEAT_INTERVAL = 10000;
    this.PAIRING_WAIT_TIME = 30000;

    /**
     *
     */
    NodeManager.prototype.bootstrapNode = function (options, app, io) {
        this.options = options;
        this.logLevel = options.logLevel;

        this.logDebug("Bootstrapping");
        this.loadPlugins();

        if (!options.proxy || options.proxy == "local") {
            if (options.nodeConfigurationFile) {
                this.state = "configured";
                this.node = this.loadNodeConfiguration(options.nodeConfigurationFile);

                utils.inheritMethods(this.node, new Node());

                this.node.initialize(this.devicePlugins, options.simulated, options.logLevel);
                this.node.start();

                this.state = "running";
            }
            else {
                this.state = "unconfigured";
                this.node = new Node();

                this.node.initialize(this.devicePlugins, options.simulated, options.logLevel);
            }
        }
        else {
            // Only reverse proxy

            if (this.existsNodeConfiguration(options.nodeConfigurationFile)) {
                this.state = "configured";
                this.node = this.loadNodeConfiguration(options.nodeConfigurationFile);

                utils.inheritMethods(this.node, new Node());

                this.node.initialize(this.devicePlugins, options.simulated, options.logLevel);
                this.node.start();

                this.state = "running";

                this
                    .logInfo("Node started in proxy mode against server " + options.proxy + " with previously pushed configuration.");
            }
            else {
                this.state = "unconfigured";
                this.node = new Node();

                this.node.initialize(this.devicePlugins, options.simulated, options.logLevel);

                this
                    .logInfo("Node started in proxy mode against server " + options.proxy + ". Configuration push required.");
            }
        }

        this.initializeCommunication(options, app, io, "");

        // Heartbeat runs as long as process is up

        this.heartbeatInterval = setInterval(
            function () {
                this
                    .publishHeartbeat();
            }.bind(this), this.HEARTBEAT_INTERVAL);

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
            this.logInfo(error);
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
        this.logInfo("===> Scanning directory [" + directory + "] for Device Plugins:");

        var list = fs.readdirSync(directory);

        for (var n in list) {
            var dirStat = fs.statSync(directory + "/" + list[n]);

            if (dirStat && dirStat.isDirectory()
                && list[n].indexOf("thing-it-device-") == 0) {
                this.logInfo("Processing Device Plugin Directory [" + list[n] + "]:");

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

                        this.logInfo("Loading Device Plugin [" + devicePath + "].");

                        try {
                            var devicePlugin = require(pluginModulePath).metadata;

                            if (!devicePlugin) {
                                throw "Module path \"" + pluginModulePath + "\" does not exit."
                            }

                            devicePlugin.module = devicePrefix;
                            devicePlugin.path = devicePath;
                            devicePlugin.modulePath = pluginModulePath;
                            devicePlugin.pluginDirectory = loadDirectory + "/" + list[n];

                            this.devicePlugins[devicePath] = devicePlugin;
                        } catch (error) {
                            this.logError("Failed to load plugin [" + devicePath
                                + "]: " + error);
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
        this.logInfo("===> Scanning directory [" + directory + "] for Unit Plugins:");

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

                this.logInfo("Loading Unit Plugin [" + unitPath + "].");

                try {
                    var unitPlugin = require(directory + "/" + pluginId).metadata;

                    if (!unitPlugin) {
                        throw "Module path \"" + directory + "/" + pluginId + "\" does not exit."
                    }

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
                    this.logError("Failed to load Unit Plugin [" + unitPath + "]: " + x);
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
        this.logInfo("Initialize REST API for server.");

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
                            this.logError(error);

                            res.status(404).send("Failed login.");

                        }.bind(this));
                    }
                    else {
                        this.logError(error);

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
                    this.start().then(function () {
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
                this.stop().then(function () {
                    res.send("");
                }.bind(this)).fail(function (error) {
                    res.status(500).send(error);
                }.bind(this));
            });
        }.bind(this));
        this.app.post("/poll", function (req, res) {
            this.verifyCallSignature(req, res, function () {
                this.node.poll();
                res.send("");
            }.bind(this));
        }.bind(this));
        this.app.post("/services/:service", function (req, res) {
            this.logDebug("Invoking Node Service [" + req.params.service + "].");

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
                    this.logError(error);

                    res.status(500)
                        .send(error);
                }
            }
        }.bind(this));
        this.app.post("/storyboards/:storyboard/:operation", function (req, res) {
            this.logDebug("Invoking operation [" + req.params.operation + "] on Node Service [" + req.params.storyboard + "].");

            if (req.params.operation != "play" && req.params.operation != "pause" && req.params.operation != "stop") {
                res.status(500)
                    .send("Storyboard operation unknown");
            }
            else {
                try {
                    this.node.findService(req.params.storyboard)[req.params.operation]();

                    res
                        .send("");
                }
                catch (error) {
                    this.logError(error);

                    res.status(500)
                        .send(error);
                }
            }
        }.bind(this));
        this.app.post("/devices/:device/services/:service", function (req, res) {
            this.logDebug("Invoking Device Service [" + req.params.service + "] on Device [" + req.params.device + "].");

            try {
                // TODO Inhomogenous with node services

                this.node[req.params.device][req.params.service](req.body);

                res.send("");
            } catch (error) {
                this.logError(error);

                res.status(500)
                    .send(error);
            }
        }.bind(this));
        this.app.post("/devices/:device/actors/:actor/services/:service", function (req, res) {
            this.logDebug("Invoking Actor Service [" + req.params.service + "] on Device [" + req.params.device
                + "] and Actor [" + req.params.actor + "].");

            try {
                // TODO Inhomogenous with node services

                this.node[req.params.device][req.params.actor][req.params.service](req.body);

                res.send("");
            } catch (error) {
                this.logError(error);

                res.status(500)
                    .send(error);
            }
        }.bind(this));
        this.app.post("/devices/:device/sensors/:sensor/event", function (req, res) {
            this.logDebug("Pushing Sensor Event [" + req.body.type + "] on Device [" + req.params.device
                + "] and Sensor [" + req.params.sensor + "].", req.body);

            try {
                this.node[req.params.device][req.params.sensor].publishEvent(req.body.type, req.body.data);

                res.send("");
            } catch (error) {
                this.logError(error);

                res.status(500)
                    .send(error);
            }
        }.bind(this));
        this.app.post("/devices/:device/sensors/:sensor/data", function (req, res) {
            this.logDebug("Pushing Sensor Data on Device [" + req.params.device
                + "] and Sensor [" + req.params.sensor + "].", req.body);

            try {
                this.node[req.params.device][req.params.sensor].publishValueChangeEvent(req.body.data);

                res.send("");
            } catch (error) {
                this.logError(error);

                res.status(500)
                    .send(error);
            }
        }.bind(this));
        this.app.get("/devices/:device/streams/:stream", function (req, res) {
            if (!req.params.device) {
                res.end("Streaming resource undefined.");
            }
            else {
                this.node.findDevice(req.params.device).pipeStream(req, res, req.params.stream);
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
                this.logError(error);
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
                this.logError(error);
                response.status(500).send(error);
            }.bind(this));
        }.bind(this));
        this.app.put("/users/:user", function (request, response) {
            this.node.createOrUpdateUser(request.body).then(function (user) {
                response.send(user);
            }.bind(this)).fail(function (error) {
                this.logError(error);
                response.status(500).send(error);
            }.bind(this));
        }.bind(this));
    };

    /**
     *
     */
    NodeManager.prototype.initializeWebSocket = function () {
        this.logInfo("Initializing Web Socket for event dispatching at " + this.namespacePrefix + "/events");

        // Open namespace for web socket connections

        this.namespace = this.io.of(this.namespacePrefix + "/events");
        this.node.namespace = this.namespace;

        this.namespace.on("connection",
            function (socket) {
                this.logInfo("Websocket connection established for Node ["
                    + this.node.id + "] at " + this.namespacePrefix + "/events.");
            }.bind(this));
        this.namespace.on("disconnect", function (socket) {
            this
                .logInfo("Websocket connection disconnected for Node ["
                + this.node.id + "] at " + this.namespacePrefix + "/events.");

            this.namespace = null;
            this.node.namespace = null;
        }.bind(this));
    };

    /**
     *
     */
    NodeManager.prototype.initializeReverseProxy = function () {
        this.logInfo("Attempt to initialize Reverse Proxy");

        var reverseProxyNamespaceUrl = this.options.proxy + "/reverse-proxy/nodes/" + this.uuid;

        this.connectInterval = setInterval(function () {
            this.logInfo("(Re)try initial NS connection for " + reverseProxyNamespaceUrl);

            if (this.reverseProxyNamespace) {
                this.logInfo("Remove all listeners on retry");
                this.reverseProxyNamespace.removeAllListeners();
            }

            getmac.getMac(function (error, macAddress) {
                if (error) {
                    this.logError("Cannot retrieve MAC address: " + error);

                    throw error;
                }

                request.post({
                    url: this.options.proxy + "/proxy/" + this.options.uuid, json: true,
                    body: {nodeBoxUuid: this.options.uuid, macAddress: macAddress}
                }, function (error, response, body) {
                    if (error) {
                        this.logInfo("Cannot reach server");
                    }
                    else {
                        this.logInfo("Server notified", body);

                        if (body.paired) {
                            this.logInfo("Node Box is paired on server.");

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
                                this.logInfo("Reverse Proxy connected.");

                                clearInterval(this.connectInterval);

                                // Start heartbeat

                                this.publishHeartbeat();

                                this.reverseProxyNamespace.on("disconnect", function (socket) {
                                    this.logDebug("Reverse Proxy disconnected");

                                    if (this.reverseProxyNamespace) {
                                        this.logInfo("Removing all listeners on disconnect");

                                        this.reverseProxyNamespace.removeAllListeners();
                                    }

                                    this.reverseProxyNamespace = null;
                                    this.node.reverseProxyNamespace = null;

                                    this.initializeReverseProxy();
                                }.bind(this));
                                this.reverseProxyNamespace.on("httpRequest", function (request) {
                                    this.logInfo("Received Reverse Proxy HTTP Request: " + request.path);
                                    this.logInfo("Method: " + request.method);
                                    this.logInfo("Path  : " + request.path);
                                    this.logInfo("Body  : ", request.body);

                                    // Mini middleware

                                    try {
                                        var details = null;

                                        if (details = this.matchRequestPath(request.path, "/plugins")) {
                                            this.reverseProxyNamespace.emit("httpResponse", {data: this.devicePlugins});
                                        }
                                        else if (details = this.matchRequestPath(request.path, "/state")) {
                                            this.reverseProxyNamespace.emit("httpResponse", {
                                                status: 0, data: this.getState()
                                            });

                                            this.logInfo("Emitted ", {
                                                status: 0, data: this.getState()
                                            });
                                        }
                                        else if (details = this.matchRequestPath(request.path, "/configuration")) {
                                            this.reverseProxyNamespace.emit("httpResponse", {
                                                data: {
                                                    status: 0, data: {
                                                        state: this.state,
                                                        configuration: this.node.clientCopy()
                                                    }
                                                }
                                            });
                                        }
                                        else if (details = this.matchRequestPath(request.path, "/poll")) {
                                            this.node.poll();
                                            this.reverseProxyNamespace.emit("httpResponse", {status: 0});
                                        }
                                        else if (details = this.matchRequestPath(request.path, "/configure")) {
                                            this.configure(request.body);
                                            this.reverseProxyNamespace.emit("httpResponse", {status: 0});
                                        }
                                        else if (details = this.matchRequestPath(request.path, "/start")) {
                                            // TODO Encapsulate

                                            this.node.start().then(function () {
                                                this.state = "running";

                                                this.reverseProxyNamespace.emit("httpResponse", {status: 0});
                                            }.bind(this)).fail(function (error) {
                                                this.reverseProxyNamespace.emit("httpError", {
                                                    status: 500,
                                                    error: error
                                                });
                                            }.bind(this));
                                        }
                                        else if (details = this.matchRequestPath(request.path, "/stop")) {
                                            // TODO Encapsulate

                                            this.node.stop();
                                            this.state = "configured";

                                            this.reverseProxyNamespace.emit("httpResponse", {status: 0});
                                        }
                                        else if (details = this.matchRequestPath(request.path, "/devices/:device/streams/:stream")) {
                                            this.reverseProxyNamespace.emit("httpResponse", {status: 0});
                                        }
                                        else if (details = this.matchRequestPath(request.path, "/devices/:device/register")) {
                                            this.reverseProxyNamespace.emit("httpResponse", {status: 0});
                                        }
                                        else if (details = this.matchRequestPath(request.path, "/devices/:device/discard")) {
                                            this.reverseProxyNamespace.emit("httpResponse", {status: 0});
                                        }
                                        else if (details = this.matchRequestPath(request.path, "/services/:service")) {
                                            if (!this.node[details.params.service]) {
                                                this.reverseProxyNamespace.emit("httpError", {
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

                                                    this.reverseProxyNamespace.emit("httpResponse", {status: 0});
                                                }
                                                catch (error) {
                                                    this.logError(error);

                                                    this.reverseProxyNamespace.emit("httpError", {
                                                        status: 500,
                                                        error: error
                                                    });
                                                }
                                            }
                                        }
                                        else if (details = this.matchRequestPath(request.path, "/devices/:device/services/:service")) {
                                            try {
                                                // TODO Inhomogenous with node services

                                                this.node[details.params.device][details.params.service](request.body);

                                                this.reverseProxyNamespace.emit("httpResponse", {status: 0});
                                            } catch (error) {
                                                this.logError(error);

                                                this.reverseProxyNamespace.emit("httpResponse", {
                                                    status: 500,
                                                    error: error
                                                });
                                            }
                                        }
                                        else if (details = this.matchRequestPath(request.path, "/devices/:device/actors/:actor/services/:service")) {
                                            try {
                                                // TODO Inhomogenous with node services

                                                this.node[details.params.device][details.params.actor][details.params.service](request.body);

                                                this.reverseProxyNamespace.emit("httpResponse", {status: 0});
                                            } catch (error) {
                                                this.logError(error);

                                                this.reverseProxyNamespace.emit("httpError", {
                                                    status: 500,
                                                    error: error
                                                });
                                            }
                                        }
                                        else if (details = this.matchRequestPath(request.path, "/data/:data")) {
                                            //res
                                            //    .send(this[req.params.data]);

                                            this.reverseProxyNamespace.emit("httpResponse", {status: 0});
                                        }
                                        else {
                                            this.logError("Unsupported request path " + request.path);

                                            this.reverseProxyNamespace.emit("httpError", {
                                                status: 500,
                                                error: "Unsupported request path " + request.path
                                            });
                                        }
                                    }
                                    catch
                                        (error) {
                                        this.logError(error);

                                        try {
                                            this.logError("Return error response.");

                                            this.reverseProxyNamespace.emit("httpError", {status: 500, error: error});
                                        }
                                        catch (error) {
                                            this.logError(error);
                                        }
                                    }
                                }.bind(this));
                            }.bind(this));
                        }
                        else {
                            this.logInfo("Node Box is unpaired - wait for pairing and retry.");

                            // Node Box is not paired and hence connection is rejected

                            clearInterval(this.connectInterval);

                            // Pause for pairing to take place and retry

                            setTimeout(function () {
                                this.initializeReverseProxy();
                            }.bind(this), this.PAIRING_WAIT_TIME);
                        }
                    }
                }.bind(this));
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
            lastConfigurationTimestamp: this.node ? this.node.lastConfigurationTimestamp : null,
            firmwareVersion: require("../package").version
        };
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

        this.node.initialize(this.devicePlugins, this.options.simulated, this.options.logLevel);

        // TODO Needed/correct?

        this.node.namespace = this.namespace;
        this.node.reverseProxyNamespace = this.reverseProxyNamespace;

        this.state = "configured";
    };

    /**
     *
     */
    NodeManager.prototype.start = function (details) {
        this.logInfo("Starting Node.");

        var deferred = q.defer();

        this.node.start().then(function () {
            this.state = "running";

            deferred.resolve();
        }.bind(this)).fail(function (error) {
            deferred.reject(error);
        }.bind(this));

        return deferred.promise;
    };

    /**
     *
     */
    NodeManager.prototype.stop = function (details) {
        this.logInfo("Stopping Node.");

        var deferred = q.defer();

        if (this.state == "running") {
            this.node.stop();
        }

        this.state = "configured";

        deferred.resolve();

        return deferred.promise;
    };

    /**
     *
     */
    NodeManager.prototype.disconnect = function (details) {
        this.logInfo("Disconnecting Node.");

        clearInterval(this.heartbeatInterval);

        //if (this.namespace) {
        //    this.namespace.disconnect();
        //}
        //
        //if (this.reverseProxyNamespace) {
        //    this.reverseProxyNamespace.disconnect();
        //}
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

    /**
     *
     */
    NodeManager.prototype.publishHeartbeat = function (details) {
        if (this.namespace) {
            this.namespace.emit("heartbeat", details);
        }

        if (this.reverseProxyNamespace) {
            this.reverseProxyNamespace.emit("heartbeat", details);
        }
    };
}

/**
 *
 */
function Node() {
    utils.inheritMethods(this, logger.create());

    // TODO May put in initialize() method and rename initialize() below

    this.devices = [];
    this.services = [];
    this.eventProcessors = [];

    /**
     *
     */
    Node.prototype.initialize = function (plugins, simulated, logLevel) {
        this.class = "Node";
        this.logLevel = logLevel;
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
                id: this.services[n].id, label: this.services[n].label, type: this.services[n].type,
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

        this.logInfo("Starting Node [" + this.label + "].");

        // Start auto-discovery

        if (this.autoDiscoveryDeviceTypes) {
            for (var n = 0; n < this.autoDiscoveryDeviceTypes.length; ++n) {
                var deviceDiscovery = discovery.create(this, this.autoDiscoveryDeviceTypes[n]);

                deviceDiscovery.start();
            }
        }

        this.logInfo("Auto-Discovery started.");

        // TODO Bind before namespace initialization?
        // TODO Need a bind function

        // Bind Devices

        for (var n = 0; n < this.devices.length; ++n) {
            this.logDebug("Bind device [" + this.devices[n].id + "]");

            device.bind(this, this.devices[n]);
        }

        // Bind Services

        for (var n in this.services) {
            if (this.services[n].type === "storyboard") {
                this.logDebug("Bind Storyboard [" + this.services[n].id + "]");
                storyboard.bind(this, this.services[n]);
            } else {
                this.logDebug("Bind Service [" + this.services[n].id + "]");
                service.bind(this, this.services[n]);
            }
        }

        this.logInfo("Services bound.");

        // Bind Jobs

        if (this.jobs) {
            for (var n in this.jobs) {
                job.bind(this, this.jobs[n]);
            }
        }

        this.logInfo("\Jobs bound.");

        // Bind Data

        if (!this.data) {
            this.data = [];
        }

        for (var n = 0; n < this.data.length; ++n) {
            data.bind(this, this.data[n]);
        }

        this.logInfo("Data bound.");

        utils
            .promiseSequence(this.data, 0, "start")
            .then(
            function () {
                this.logInfo("Data started.");

                // Start Devices

                utils
                    .promiseSequence(this.devices, 0, "startDevice")
                    .then(
                    function () {
                        this.logInfo("Devices started.");

                        try {
                            // Event Processors

                            for (var n = 0; n < this.eventProcessors.length; ++n) {
                                eventProcessor
                                    .bind(
                                    this,
                                    this.eventProcessors[n])
                                    .start();
                            }

                            this.logInfo("Event Processors started.");

                            // Activate Jobs

                            if (this.jobs) {
                                for (var n in this.jobs) {
                                    this.jobs[n]
                                        .activate();
                                }
                            }

                            this.logInfo("Jobs activated.");
                            this.logInfo("Node ["
                                + this.label
                                + "] started.");

                            deferred.resolve();
                        } catch (x) {
                            this.logError(x);

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

        throw "No Device with ID [" + id + "].";
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

        throw "No Service with ID [" + id + "].";
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
        this.logInfo("Stopping Node [" + this.label + "].");

        for (var n = 0; n < this.devices.length; ++n) {
            this.devices[n].stop();
        }

        this.logInfo("Stopped Node [" + this.label + "].");
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
            this.logInfo(error);
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
            this.logInfo(error);
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
            this.logInfo(error);
        }
    };

    /**
     *
     */
    Node.prototype.publishStoryboardProgress = function (storyboard, elapsedTime) {
        try {
            if (this.namespace) {
                this.namespace.emit("storyboardProgress", {
                    storyboard: storyboard.id,
                    elapsedTime: elapsedTime
                });
            }

            if (this.reverseProxyNamespace) {
                this.reverseProxyNamespace.emit("storyboardProgress", {
                    storyboard: storyboard.id,
                    elapsedTime: elapsedTime
                });
            }
        }
        catch (error) {
            this.logInfo(error);
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
            this.logInfo("Failed to invoke Service [" + serviceId + "]:");
            this.logInfo(x);
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
        if (!script) {
            this.logDebug("Script is empty");
        }

        script.replace("\n", "");
        script.replace('\"', '"');

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

        this.logInfo("Before device");
        for (var n in this.devices) {
            this.logInfo("Device", this.devices[n]);
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