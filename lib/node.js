module.exports = {
    plugins: loadPlugins,
    create: function (node) {
        utils.inheritMethods(node, new Node());

        node.simulated = true;
        node.namespacePrefix = "/nodes/" + node.uuid;

        node.loadPlugins();

        return node;
    },
    bootstrap: function (options, app, io, server) {
        io.listen(server);

        if (options.proxy == "local") {
            var node = loadNodeConfiguration(options.nodeConfigurationFile);

            if (node) {
                utils.inheritMethods(node, new Node());

                node.initialize(options, app, io, server);
                node.start();
            } else {
                throw "No Node Configuration present. Configuration push required.";
            }
        }
        else {
            new Node().initialize(options, app, io, server);

            console
                .log("\nNode started in proxy mode against server " + options.proxy + ". Configuration push required.");
        }
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
 * @returns
 */
function loadNodeConfiguration(nodeConfigurationFile) {
    try {
        var node;

        if (nodeConfigurationFile.indexOf(".js", nodeConfigurationFile.length
                - ".js".length) !== -1) {
            // Assuming that configuration file is a nodejs module and exports
            // the node configuration

            node = require(nodeConfigurationFile);
            node.configuration = JSON.parse(JSON.stringify(node))
        } else {
            node = JSON.parse(fs.readFileSync(nodeConfigurationFile, {
                encoding: "utf-8"
            }));
            node.configuration = JSON.parse(JSON.stringify(node))
        }

        node.state = "configured";

        return node;
    } catch (x) {
        console.log(x);
        throw "Cannot read node configuration from file "
        + nodeConfigurationFile + ".";
    }
}

/**
 *
 * @param node
 */
function saveNodeConfiguration(node) {
    fs.writeFileSync(nodeConfigurationFile, JSON.stringify(node), {
        encoding: "utf-8"
    });
}

/**
 *
 */
function loadPlugins() {
    var devicePlugins = {};
    var unitPlugins = {};

    scanDevicePluginDirectories(devicePlugins, unitPlugins, __dirname
        + "/default-devices", "/lib/default-devices");

    // TODO Scan modules

    // Collect units

    scanUnitPluginDirectories(devicePlugins, unitPlugins, __dirname
        + "/default-units", "/lib/default-units");

    // TODO Scan modules

    // Resolve Unit Inheritance

    for (var n in unitPlugins) {
        var subUnit = unitPlugins[n];

        if (subUnit.superUnit) {
            inheritFromSuperUnit(subUnit, unitPlugins[subUnit.superUnit]);
        }
    }

    // Resolve Device Inheritance

    for (var n in devicePlugins) {
        var subDevice = devicePlugins[n];

        if (subDevice.superDevice) {
            inheritFromSuperDevice(subDevice,
                devicePlugins[subDevice.superDevice]);
        }
    }

    return devicePlugins;
};

/**
 *
 * @param devicePlugins
 * @param plugins
 * @param directory
 */
function scanDevicePluginDirectories(devicePlugins, unitPlugins, directory, loadDirectory) {
    var list = fs.readdirSync(directory);

    for (var n in list) {
        var dirStat = fs.statSync(directory + "/" + list[n]);

        if (dirStat && dirStat.isDirectory()
            && list[n].indexOf("thing-it-device-") == 0) {
            var devicePrefix = list[n].substring("thing-it-device-".length);
            var pluginFiles = fs.readdirSync(directory + "/" + list[n]);

            for (var m in pluginFiles) {
                var pluginFilePath = directory + "/" + list[n] + "/"
                    + pluginFiles[m];
                var fileStat = fs.statSync(pluginFilePath);

                if (fileStat && fileStat.isFile()) {
                    var pluginModulePath = pluginFilePath.substring(0,
                        pluginFilePath.indexOf(".js"));
                    var pluginId = pluginFiles[m].substring(0, pluginFiles[m]
                        .indexOf(".js"));
                    var devicePath = devicePrefix + "/" + pluginId;

                    console.log("Loading Device Plugin [" + devicePath + "].");

                    try {
                        var devicePlugin = require(pluginModulePath).metadata;

                        devicePlugin.module = devicePrefix;
                        devicePlugin.path = devicePath;
                        devicePlugin.modulePath = pluginModulePath;
                        devicePlugin.pluginDirectory = loadDirectory + "/" + list[n];

                        devicePlugins[devicePath] = devicePlugin;
                    } catch (x) {
                        console.log("Failed to load plugin [" + devicePath
                            + "]:");
                        console.log(x);
                    }
                }
            }

            // Load Default Units

            loadUnitPlugins(devicePlugins, unitPlugins, directory + "/"
                + list[n] + "/default-units", devicePrefix, loadDirectory + "/" + list[n]);
        }
    }
}

/**
 *
 * @param unitPlugins
 * @param directory
 */
function scanUnitPluginDirectories(devicePlugins, unitPlugins, directory, loadDirectory) {
    var list = fs.readdirSync(directory);

    for (var n in list) {
        var dirStat = fs.statSync(directory + "/" + list[n]);

        if (dirStat && dirStat.isDirectory()
            && list[n].indexOf("thing-it-unit-") == 0) {
            var unitPrefix = list[n].substring("thing-it-unit-".length);

            loadUnitPlugins(devicePlugins, unitPlugins, directory + "/"
                + list[n], unitPrefix, loadDirectory + "/" + list[n]);
        }
    }
}

/**
 *
 * @param devicePlugins
 * @param unitPlugins
 * @param directory
 * @param unitPrefix
 */
function loadUnitPlugins(devicePlugins, unitPlugins, directory, unitPrefix, pluginDirectory) {
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

                unitPlugins[unitPath] = unitPlugin;

                // Add Unit to Device Types

                for (var l in unitPlugin.deviceTypes) {
                    if (unitPlugin.role == "actor") {
                        devicePlugins[unitPlugin.deviceTypes[l]].actorTypes
                            .push(unitPlugin);
                    } else if (unitPlugin.role == "sensor") {
                        devicePlugins[unitPlugin.deviceTypes[l]].sensorTypes
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
}

/**
 *
 * @param array
 * @param field
 * @param value
 * @returns {Boolean}
 */
function containsElementWithFieldValue(array, field, value) {
    for (var n in array) {
        if (array[n][field] == value) {
            return true;
        }
    }

    return false;
}

/**
 *
 * @param subUnit
 * @param superUnit
 */
function inheritFromSuperUnit(subUnit, superUnit) {
    for (var n in superUnit.configuration) {
        if (!containsElementWithFieldValue(subUnit.configuration, "id",
                superUnit.configuration[n].id)) {
            subUnit.configuration.push(superUnit.configuration[n]);
        }
    }

    for (var n in superUnit.state) {
        if (!containsElementWithFieldValue(subUnit.state, "id",
                superUnit.state[n].id)) {
            subUnit.state.push(superUnit.state[n]);
        }
    }

    if (subUnit.role == "actor") {
        for (var n in superUnit.services) {
            if (!containsElementWithFieldValue(subUnit.services, "id",
                    superUnit.services[n].id)) {
                subUnit.services.push(superUnit.services[n]);
            }
        }
    }
}

/**
 *
 * @param subDevice
 * @param superDevice
 */
function inheritFromSuperDevice(subDevice, superDevice) {
    // Inherit Types

    for (var n in superDevice.dataTypes) {
        if (!subDevice.dataTypes[n]) {
            subDevice.dataTypes[n] = superDevice.dataTypes[n];
        }
    }

    // Inherit Actor Types

    for (var n in superDevice.actorTypes) {
        if (!containsElementWithFieldValue(subDevice.actorTypes, "plugin",
                superDevice.actorTypes[n].plugin)) {
            subDevice.actorTypes.push(superDevice.actorTypes[n]);
        }
    }

    // Inherit Sensor Types

    for (var n in superDevice.sensorTypes) {
        if (!containsElementWithFieldValue(subDevice.sensorTypes, "plugin",
                superDevice.sensorTypes[n].plugin)) {
            subDevice.sensorTypes.push(superDevice.sensorTypes[n]);
        }
    }
}

/**
 *
 */
function Node() {
    this.state = "pending";

    Node.prototype.clientCopy = function () {
        var copy = {
            uuid: this.uuid,
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
    Node.prototype.initialize = function (options, app, io, server) {
        this.options = options;
        this.app = app;
        this.io = io;
        this.namespacePrefix = "";
        this.simulated = options.simulated;

        // Set UUID only if not set from configuration

        if (!this.uuid)
        {
            this.uuid = this.options.uuid;
        }

        //this.initializeSecurityConfiguration();
        this.loadPlugins();

        this.pendingDeviceRegistrations = {};

        this.initializeReverseProxy();

        // Initialize Web Socket
        // TODO Is that even needed for proxy mode (as there is never a web app listening to that directly)

        console.log("Initializing Web Socket for event dispatching.");

        // Open namespace for web socket connections

        this.namespace = this.io.of(this.namespacePrefix + "/events");

        var self = this;

        this.namespace.on("connection",
            function (socket) {
                console.log("Websocket connection established for Node "
                    + self.id + " at " + this.namespacePrefix + "/events.");
            }.bind(this));
        this.namespace.on("disconnect", function (socket) {
            console
                .log("Websocket connection disconnected for Node "
                + self.id + " at " + this.namespacePrefix + "/events.");
        }.bind(this));

        // Initialize REST API for server (this is needed even in proxy mode, because the Web Socket events received via
        // the Reverse Proxy will talk to these REST services locally)

        console.log("Initialize REST API for server.");

        var self = this;

        app.get("/settings", function (req, res) {
            res.send({
                server: "local",
                authentication: this.options.authentication
            });
        }.bind(this));
        app.post("/login", function (req, res) {
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

                        this.createEntitlementsForUser(user);

                        this.createOrUpdateUser(user).then(function (user) {
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
        app.post("/logout", function (req, res) {
            res.send(req.body);
        });
        app.get("/plugins", function (req, res) {
            self.verifyCallSignature(req, res, function () {
                res.send(self.plugins);
            });
        });
        app.get("/state", function (req, res) {
            this.verifyCallSignature(req, res, function () {
                res.send({
                    state: this.state,
                    configuration: this.configuration
                });
            }.bind(this));
        }.bind(this));
        app.get("/configuration", function (req, res) {
            self.verifyCallSignature(req, res, function () {
                // Send the plain configuration

                res.send(self.clientCopy());
            });
        });
        app
            .post(
            "/configure",
            function (req, res) {
                self
                    .verifyCallSignature(
                    req,
                    res,
                    function () {
                        if (self.state == "running") {
                            self.stop();
                        }

                        saveNodeConfiguration(req.body);

                        node = loadNodeConfiguration(self.options.nodeConfigurationFile);

                        // TODO Is the recursive closure
                        // an issue for thousands of
                        // configure calls, possibly
                        // load into node?

                        utils.inheritMethods(node,
                            new Node());
                        node.initialize(configuration,
                            app, io, server);
                        node.start(app, io
                            .listen(server))

                        res.send("");
                    });
            });
        app.post("/start", function (req, res) {
            this.verifyCallSignature(req, res, function () {
                if (this.state == "configured") {
                    this.start(app, io.listen(server)).then(function () {
                        res.send("");
                    }).fail(function (error) {
                        res.status(500).send(error);
                    });
                } else {
                    res.status(500).send("Node is not configured.");
                }
            }.bind(this));
        }.bind(this));
        app.post("/stop", function (req, res) {
            self.verifyCallSignature(req, res, function () {
                self.stop();
                res.send("");
            });
        });
        app.post("/poll", function (req, res) {
            this.verifyCallSignature(req, res, function () {
                this.poll();
                res.send("");
            }.bind(this));
        }.bind(this));
        app.get("/devices/:device/streams/:stream", function (req, res) {
            if (!req.params.device) {
                res.end("Streaming resource undefined.");
            }
            else {
                self.findDevice(req.params.device).pipeStream(req, res, req.params.stream);
            }
        });
        app.post("/devices/:device/register", function (req, res) {
            if (!req.params.device) {
                res.status(500).end("Device undefined.");
            }
            else {
                if (!this.pendingDeviceRegistrations[req.params.device]) {
                    res.status(500).end("No Device [" + req.params.device + "] pending for registration.");
                }
                else {
                    var newDevice = this.pendingDeviceRegistrations[req.params.device];

                    delete this.pendingDeviceRegistrations[req.params.device]

                    var index = utils.getNextIdIndex(this.devices, device.plugin, 1);

                    newDevice.id = newDevice.__type.plugin + index;
                    newDevice.label = newDevice.__type.label + " " + index;

                    this.devices.push(newDevice);

                    device.bind(this, newDevice);
                    newDevice.start();

                    res.send(this.clientCopy());
                }
            }
        }.bind(this));
        app.post("/devices/:device/discard", function (req, res) {
            if (!req.params.device) {
                res.status(500).end("Device undefined.");
            }
            else {
                if (!this.pendingDeviceRegistrations[req.params.device]) {
                    res.status(500).end("No Device [" + req.params.device + "] pending for registration.");
                }
                else {
                    delete this.pendingDeviceRegistrations[req.params.device]

                    res.send("");
                }
            }
        }.bind(this));
        app.get("/users", function (request, response) {
            this.getUsers().then(function (users) {
                console.log(users[0]);
                response.send({users: users});
            }.bind(this)).fail(function (error) {
                console.trace(error);
                response.status(500).send(error);
            }.bind(this));
        }.bind(this));
        app.post("/users", function (request, response) {
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

            this.createOrUpdateUser(request.body).then(function (user) {
                response.send(user);
            }.bind(this)).fail(function (error) {
                console.trace(error);
                response.status(500).send(error);
            }.bind(this));
        }.bind(this));
        app.put("/users/:user", function (request, response) {
            this.createOrUpdateUser(request.body).then(function (user) {
                response.send(user);
            }.bind(this)).fail(function (error) {
                console.trace(error);
                response.status(500).send(error);
            }.bind(this));
        }.bind(this));

        // TODO Need a local buffer for default configuration

        this.state = "unconfigured";
    };

    /**
     *
     */
    Node.prototype.loadPlugins = function () {
        this.plugins = loadPlugins();
    };

    /**
     *
     */
    Node.prototype.initializeSecurityConfiguration = function () {
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
    Node.prototype.initializeReverseProxy = function () {
        if (!this.options.proxy || this.options.proxy === "local") {
            return;
        }

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

            this.reverseProxyNamespace.on("connect", function () {
                console.debug("Reverse Proxy connected.");

                clearInterval(this.connectInterval);
            }.bind(this));
            this.reverseProxyNamespace.on("disconnect", function (socket) {
                console.debug("Reverse Proxy disconnected");

                clearInterval(this.connectInterval);
                this.initializeReverseProxy();
            }.bind(this));
            this.reverseProxyNamespace.on("httpRequest", function (request) {
                console.debug("HTTP Request " + request.path);

                try {
                    // TODO Need to stream body data, but probably not a problem yet

                    var bodyData = "";

                    if (request.body) {
                        bodyData = JSON.stringify(request.body);
                    }

                    var options = {
                        hostname: "localhost",
                        port: this.options.port,
                        path: request.path,
                        method: request.method,
                        headers: {} // TODO May need to add some
                    };

                    console.log(options);
                    console.log(request.body);

                    // TODO Send request to the Node's middleware?

                    var proxyRequest = http.request(options, function (response) {
                        response.on('data', function (data) {
                            console.debug("Response Data: " + data);

                            this.reverseProxyNamespace.emit("httpResponseData", {status: 0, data: data});
                        }.bind(this));
                        response.on('end', function () {
                            console.debug("Response End");

                            this.reverseProxyNamespace.emit("httpResponseEnd", {status: 0});
                        }.bind(this));
                        response.on('error', function (error) {
                            console.debug("Response Error: " + error);

                            this.reverseProxyNamespace.emit("httpResponseError", {status: 500, error: error});
                        }.bind(this));
                    }.bind(this)).on('error', function (error) {
                        console.error(error);

                        this.reverseProxyNamespace.emit("httpResponseError", {status: 500, error: error});
                    }.bind(this));

                    // Submit request

                    if (request.method != "GET") {
                        proxyRequest.write(bodyData);
                    }

                    proxyRequest.end();

                    console.log("Request submitted");
                }
                catch (error) {
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
    }

    /**
     *
     */
    Node.prototype.verifyCallSignature = function (request, response, callback) {
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

        // Bind Jobs

        if (this.jobs) {
            for (var n in this.jobs) {
                job.bind(this, this.jobs[n]);
            }
        }

        // Bind Data

        if (!this.data) {
            this.data = [];
        }

        for (var n = 0; n < this.data.length; ++n) {
            data.bind(this, this.data[n]);
        }

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

                            this.app
                                .post(
                                "/services/:service",
                                function (req,
                                          res) {
                                    this
                                        .verifyCallSignature(
                                        req,
                                        res,
                                        function () {
                                            if (!this[req.params.service]) {
                                                res.status(500)
                                                    .send("Service does not exist");
                                            }
                                            else {
                                                try {
                                                    if (!req.body || !req.body.parameters) {
                                                        this[req.params.service]
                                                        ();
                                                    }
                                                    else {
                                                        this[req.params.service]
                                                        (req.body.parameters);
                                                    }

                                                    res
                                                        .send("");
                                                }
                                                catch (error)
                                                {
                                                    res.status(500)
                                                        .send("Failed to invoke Service.");
                                                }
                                            }
                                        }.bind(this));
                                }.bind(this));

                            this.app
                                .get(
                                "/data/:data",
                                function (req,
                                          res) {
                                    self
                                        .verifyCallSignature(
                                        req,
                                        res,
                                        function () {
                                            res
                                                .send(this[req.params.data]);
                                        });
                                }.bind(this));

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

                            this.state = "running";

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

        this.state = "configured";
    };

    /**
     *
     */
    Node.prototype.publishMessage = function (message) {
        this.namespace.emit("message", message);

        if (this.reverseProxyNamespace) {
            this.reverseProxyNamespace.emit("message", message);
        }
    };

    /**
     *
     */
    Node.prototype.publishEvent = function (event) {
        this.namespace.emit("event", event);

        if (this.reverseProxyNamespace) {
            this.reverseProxyNamespace.emit("event", event);
        }
    };

    /**
     *
     */
    Node.prototype.publishHeartbeat = function (details) {
        this.namespace.emit("heartbeat", details);

        if (this.reverseProxyNamespace) {
            this.reverseProxyNamespace.emit("heartbeat", details);
        }
    };

    /**
     *
     */
    Node.prototype.publishDeviceStateChange = function (device, state) {
        this.namespace.emit("deviceStateChange", {
            device: device.id,
            state: state
        });

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
            this.namespace.emit("actorStateChange", {
                device: device.id,
                actor: actor.id,
                state: state
            });

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
            this.namespace.emit("deviceAdvertisement", {
                uuid: device.uuid,
                label: device.label
            });

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
            this.namespace.emit("deviceRegistration", {
                device: device.id
            });

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
        script = this.preprocessScript(script);

        with (this) {
            eval(script);
        }

        this.saveData();
    };

    /**
     *
     */
    Node.prototype.preprocessScript = function (script) {
        // Do nothing for now

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