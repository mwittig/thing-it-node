module.exports = {
    plugins: function (additionalPluginDirectories) {
        if (!defaultNodeManager) {
            defaultNodeManager = new NodeManager();

            defaultNodeManager.loadPlugins(additionalPluginDirectories);
        }

        return defaultNodeManager.devicePlugins;
    },
    createNode: function (options) {
        if (!defaultNodeManager) {
            defaultNodeManager = new NodeManager();

            defaultNodeManager.loadPlugins();
        }

        return new Node().initialize(defaultNodeManager.devicePlugins, options);
    },
    initialize: function (options) {
        var nodeManager = new NodeManager();

        return nodeManager.initialize(null, options);
    },
    bootstrap: function (options, app, io) {
        var nodeManager = new NodeManager();

        return nodeManager.bootstrapNode(null, options, app, io);
    },
    bootstrapFromNode: function (node, options, app, io, namespace, additionalPluginDirectories) {
        var nodeManager = new NodeManager();

        return nodeManager.bootstrapNode(node, options, app, io, namespace, additionalPluginDirectories);
    },
    bind: function (node) {
        utils.inheritMethods(node, new Node());

        return node.bind();
    }
};

var npm = require('npm');
var _ = require('lodash');
var utils = require("./utils");
var logger = require("./logger");
var discovery = require("./discovery");
var device = require("./device");
var actor = require("./actor");
var sensor = require("./sensor");
var service = require("./service");
var group = require("./group");
var storyboard = require("./storyboard");
var job = require("./job");
var eventProcessor = require("./eventProcessor");
var data = require("./data");
var docker = require("./docker");

var ConfigurationManager = require("./configurationManager");

var fs = require("fs");
var socketIoClient = require('socket.io-client');
var path = require("path");
var q = require('q');
var crypto = require('crypto');
var request = require('request');
var Request = request;
var getmac = require('getmac');
var npm = require("npm");
var Busboy = require("busboy");
//var uuidv1 = require('uuid/v1');
var mime = require("mime");
var moment = require("moment");
var stream = require('stream');

var defaultNodeManager;

/**
 *
 * @constructor
 */
function NodeManager() {
    this.class = "NodeManager";

    utils.inheritMethods(this, logger.create());

    this.HEARTBEAT_INTERVAL = 10000;
    this.PAIRING_WAIT_TIME = 30000;
    this.PROXY_RETRY_TIME = 15000;

    /**
     *
     */
    NodeManager.prototype.bootstrapNode = function (node, options, app, io, namespace, additionalPluginDirectories) {
        this.initialize(node, options, additionalPluginDirectories);
        this.run(app, io, namespace);

        this.logInfo("Starting Configuration Manager.");

        if (!this.options.noBtleConfiguration) {
            var configDir = this.options.nodeConfigurationsDirectory;

            configDir = configDir.substring(0, configDir.indexOf("/configurations"));

            var configurationManager = ConfigurationManager.create(
                this.options.bootDir,
                configDir,
                this.options.rebootCmd);

            configurationManager.listen();
        }

        return this;
    };

    /**
     *
     */
    NodeManager.prototype.initialize = function (node, options, additionalPluginDirectories) {
        this.options = options;
        this.logLevel = options.logLevel;

        this.loadPlugins(additionalPluginDirectories);
        this.logDebug("Plugins loaded.");

        if (options.nodeConfigurationsDirectory) {
            if (node) {
                throw "Cannot specify Node and Node Configuration Directory.";
            }

            this.state = "configured";
            this.node = this.loadNodeConfigurations();
            this.node.__nodeManager = this;

            utils.inheritMethods(this.node, new Node());

            this
                .logInfo("Initializing Gateway with previously created configuration.");
        }
        else {
            this.state = "unconfigured";

            if (node) {
                this.logDebug("Bind existing Node.");

                this.node = node;
                this.node.__nodeManager = this;

                utils.inheritMethods(this.node, new Node());
            } else {
                this.node = new Node();

                this.node.__nodeManager = this;
                this.node.id = "myNode";
                this.node.label = "My Node";
            }

            this
                .logInfo("Initializing Gateway with new configuration.");
        }

        this.node.initialize(this.devicePlugins, options);

        return this;
    };

    /**
     *
     * @returns
     */
    NodeManager.prototype.run = function (app, io, namespace) {
        this.node.start();

        this.state = "running";

        if (!this.options.proxy || this.options.proxy == "local") {
            this
                .logInfo("Node started in local mode.");
        }
        else {
            this
                .logInfo("Node started in proxy mode against server " + this.options.proxy + ".");
        }

        this.initializeCommunication(this.options, app, io, namespace);

        this
            .logInfo("Communication initialized.");

        // Heartbeat runs as long as process is up

        this.heartbeatInterval = setInterval(
            function () {

                var details = this.getState();

                details.gateway = this.uuid;

                this
                    .publishHeartbeat(details);
            }.bind(this), this.HEARTBEAT_INTERVAL);

        this
            .logInfo("Heartbeat started.");

        return this;
    };

    /**
     *
     * @returns
     */
    NodeManager.prototype.loadNodeConfigurations = function () {
        // This map is a cache for the name-mangled version Configuration File content

        this.configurationsMap = {};

        var node = {
            id: "theNode",
            label: "The Node",
            autoDiscoveryDeviceTypes: [],
            devices: [],
            services: [],
            eventProcessors: [],
            jobs: [],
            groups: [],
            data: []
        };

        this.logInfo("===> Scanning directory [" + this.options.nodeConfigurationsDirectory + "] for Node Configurations:");

        var list = fs.readdirSync(this.options.nodeConfigurationsDirectory);

        var nodeConfiguration;
        var count = 0;

        for (var n in list) {
            var fileStat = fs.statSync(this.options.nodeConfigurationsDirectory + "/" + list[n]);

            if (fileStat && fileStat.isFile()) {
                this.logDebug("Processing file " + this.options.nodeConfigurationsDirectory + "/" + list[n]);

                // Clear require cache

                delete require.cache[this.options.nodeConfigurationsDirectory + "/" + list[n]];

                nodeConfiguration = require(this.options.nodeConfigurationsDirectory + "/" + list[n], {
                    encoding: "utf-8"
                });

                if (!nodeConfiguration.uuid) {
                    nodeConfiguration.uuid = "" + 4711; //uuidv1();

                    this.logDebug("Patched UUID " + nodeConfiguration.uuid);
                }

                // Inherit simulation settings if not set

                if (!nodeConfiguration.simulated) {
                    nodeConfiguration.simulated = this.options.simulated;
                }

                this.logDebug("Name mangling");
                this.nameMangleNodeConfiguration(nodeConfiguration);
                this.logDebug("Adding to map");

                this.configurationsMap[nodeConfiguration.uuid] = {
                    configuration: _.cloneDeep(nodeConfiguration), //  Keep clean copy of name-mangled configuration
                    filePath: this.options.nodeConfigurationsDirectory + "/" + list[n]
                };

                if (list[n].indexOf("thing-it-node-default") >= 0) {
                    this.defaultNodeConfiguration = nodeConfiguration;
                }

                this.logDebug("Adding to node");
                this.addNodeConfiguration(node, nodeConfiguration);

                count++;
            }
        }

        if (!this.defaultNodeConfiguration) {
            if (count == 1) {
                this.logDebug("Loaded is default");

                this.defaultNodeConfiguration = nodeConfiguration;
            }
            else {
                this.defaultNodeConfiguration = {
                    uuid: 4711, //uuidv1(),
                    id: "thingItNodeDefaultNodeConfiguration",
                    label: "[thing-it-node] Default Node Configuration",
                    devices: [],
                    services: [],
                    eventProcessors: [],
                    jobs: [],
                    groups: [],
                    data: []
                };

                this.configurationsMap[this.defaultNodeConfiguration.uuid] = {
                    configuration: _.cloneDeep(this.defaultNodeConfiguration),
                    filePath: this.options.nodeConfigurationsDirectory + "/thing-it-node-default.js"
                }
            }
        }

        return node;
    };

    /**
     *
     * @param node
     * @param nodeConfiguration
     */
    NodeManager.prototype.nameMangleNodeConfiguration = function (nodeConfiguration) {
        this.logDebug("Name-mangling Devices");

        for (var n in nodeConfiguration.devices) {
            nodeConfiguration.devices[n].id = this.mangleId(nodeConfiguration.uuid, nodeConfiguration.devices[n].id);
        }

        this.logDebug("Name-mangling Data");

        for (var n in nodeConfiguration.data) {
            nodeConfiguration.data[n].id = this.mangleId(nodeConfiguration.uuid, nodeConfiguration.data[n].id);
        }

        this.logDebug("Name-mangling Services");

        for (var n in nodeConfiguration.services) {
            nodeConfiguration.services[n].id = this.mangleId(nodeConfiguration.uuid, nodeConfiguration.services[n].id);

            if (nodeConfiguration.services[n].type === "script" && nodeConfiguration.services[n].content &&
                nodeConfiguration.services[n].content.script) {
                nodeConfiguration.services[n].content.script = this.mangleScript(nodeConfiguration.uuid,
                    nodeConfiguration.services[n].content.script);
            }

            if (nodeConfiguration.services[n].type === "storyboard") {
                for (var m in nodeConfiguration.services[n].content.timeline) {
                    var entries = nodeConfiguration.services[n].content.timeline[m].entries;

                    for (var l in entries) {
                        this.mangleAction(nodeConfiguration.uuid, entries[l].service);
                    }
                }
            }
        }

        this.logDebug("Name-mangling Event Processors");

        for (var n in nodeConfiguration.eventProcessors) {
            nodeConfiguration.eventProcessors[n].id = this.mangleId(nodeConfiguration.uuid, nodeConfiguration.eventProcessors[n].id);

            for (var m in nodeConfiguration.eventProcessors[n].observables) {
                nodeConfiguration.eventProcessors[n].observables[m] = this.mangleId(nodeConfiguration.uuid, nodeConfiguration.eventProcessors[n].observables[m]);
            }

            this.mangleAction(nodeConfiguration.uuid, nodeConfiguration.eventProcessors[n].action);
        }

        this.logDebug("Name-mangling Services");

        for (var n in nodeConfiguration.jobs) {
            nodeConfiguration.jobs[n].id = this.mangleId(nodeConfiguration.uuid, nodeConfiguration.jobs[n].id);

            this.mangleAction(nodeConfiguration.uuid, nodeConfiguration.jobs[n].action);
        }

        this.logDebug("Name-mangling Groups");

        for (var n in nodeConfiguration.groups) {
            nodeConfiguration.groups[n].id = this.mangleId(nodeConfiguration.uuid, nodeConfiguration.groups[n].id);

            this.mangleGroup(nodeConfiguration.uuid, nodeConfiguration.groups[n]);
        }
    };

    /**
     *
     * @param uuid
     * @param id
     */
    NodeManager.prototype.addNodeConfiguration = function (node, nodeConfiguration) {
        node.autoDiscoveryDeviceTypes.push.apply(node.autoDiscoveryDeviceTypes, nodeConfiguration.autoDiscoveryDeviceTypes);
        node.devices.push.apply(node.devices, nodeConfiguration.devices);
        node.services.push.apply(node.services, nodeConfiguration.services);
        node.eventProcessors.push.apply(node.eventProcessors, nodeConfiguration.eventProcessors);
        node.jobs.push.apply(node.jobs, nodeConfiguration.jobs);
        node.data.push.apply(node.data, nodeConfiguration.data);
        node.groups.push.apply(node.groups, nodeConfiguration.groups);

        // TODO Scoping per Configuration? If so, we need to consider single configuration and also unmangling
        //var group = {
        //    id: nodeConfiguration.id, label: nodeConfiguration.label, subGroups: nodeConfiguration.groups,
        //    devices: [], actors: [], sensors: []
        //};
        //
        //node.groups.push(group);
    };

    NodeManager.prototype.mangleId = function (uuid, id) {
        return "ti__" + uuid.replace(/-/g, "_") + "__" + id;
    };

    NodeManager.prototype.extractNodeUuid = function (id) {
        id = id.substring(id.indexOf("ti__") + 4);

        return id.substring(0, id.indexOf("__")).replace(/_/g, "-");
    };

    NodeManager.prototype.unmangleId = function (id) {
        id = id.substring(id.indexOf("ti__") + 4);

        return id.substring(id.indexOf("__") + 2);
    };

    NodeManager.prototype.belongsToConfiguration = function (id, uuid) {
        return id.indexOf("ti__" + uuid.replace(/-/g, "_")) == 0;
    };

    /**
     *
     * @param node
     * @param nodeConfiguration
     */
    NodeManager.prototype.mangleGroup = function (uuid, group) {
        for (var n in group.devices) {
            group.devices[n] = this.mangleId(uuid, group.devices[n]);
        }

        for (var n in group.actors) {
            group.actors[n] = this.mangleId(uuid, group.actors[n]);
        }

        for (var n in group.sensors) {
            group.sensors[n] = this.mangleId(uuid, group.sensors[n]);
        }

        for (var n in group.services) {
            group.services[n] = this.mangleId(uuid, group.services[n]);
        }

        for (var n in group.subGroups) {
            this.mangleGroup(uuid, group.subGroups[n]);
        }
    };

    /**
     *
     * @param node
     * @param nodeConfiguration
     */
    NodeManager.prototype.mangleAction = function (uuid, action) {
        if (!action || !action.content) {
            return;
        }

        // Only node services need to be mangled

        if (action.type === 'nodeService' && action.content.service) {
            action.content.service = this.mangleId(uuid, action.content.service);
        }

        if (action.content.device) {
            action.content.device = this.mangleId(uuid, action.content.device);
        }

        if (action.content.setPointVariable) {
            if (action.content.setPointVariable.device) {
                  action.content.setPointVariable.device = this.mangleId(uuid, action.content.setPointVariable.device);
            }

            if (action.content.setPointVariable.data) {
                  action.content.setPointVariable.data = this.mangleId(uuid, action.content.setPointVariable.data);
            }
        }

        if (action.content.controlVariable) {
            if (action.content.controlVariable.device) {
                  action.content.controlVariable.device = this.mangleId(uuid, action.content.controlVariable.device);
            }

            if (action.content.controlVariable.data) {
                  action.content.controlVariable.data = this.mangleId(uuid, action.content.controlVariable.data);
            }
        }
    };

    /**
     *
     * @param node
     * @param nodeConfiguration
     */
    NodeManager.prototype.mangleScript = function (uuid, script) {
        return script.replace(/\[node\]\./g, this.mangleId(uuid, ""));
    };

    /**
     *
     * Creates a deep copy of a (n arbitrary) configuration - a merged node for local access or single configuration for Push Proxy.
     *
     * TODO Use _.clone() && filtering?
     *
     * @deprecated
     *
     * @param configuration
     * @returns {{id: (n|number), label: *, lastConfigurationTimestamp: (*|number), devices: Array, services: Array, groups: Array, eventProcessors: Array, jobs: Array, data: Array}}
     */
    NodeManager.prototype.clientCopy = function (configuration) {
        this.logDebug("Copying Configuration/Node " + configuration.uuid);

        var copy = {
            simulated: configuration.simulated,
            uuid: configuration.uuid,
            mesh: configuration.mesh,
            id: configuration.id,
            label: configuration.label,
            lastConfigurationTimestamp: configuration.lastConfigurationTimestamp,
            devices: [],
            services: [],
            groups: [],
            eventProcessors: [],
            jobs: [],
            data: []
        };

        // TODO All copying should be done via utils.cloneDeep()

        this.logDebug("Copying Devices");

        for (var n in configuration.devices) {
            copy.devices.push(configuration.devices[n].clientCopy());
        }

        this.logDebug("Copying Groups");

        for (var n in configuration.groups) {
            copy.groups.push(configuration.groups[n].clientCopy());
        }

        this.logDebug("Copying Services");

        for (var n in configuration.services) {
            copy.services.push(configuration.services[n].clientCopy());
        }

        this.logDebug("Copying Event Processors");

        for (var n in configuration.eventProcessors) {
            copy.eventProcessors.push(configuration.eventProcessors[n].clientCopy());
        }

        this.logDebug("Copying Jobs");

        for (var n in configuration.jobs) {
            copy.jobs.push({
                id: configuration.jobs[n].id,
                label: configuration.jobs[n].label,
                startTimestamp: configuration.jobs[n].startTimestamp,
                fromNextFullOf: configuration.jobs[n].fromNextFullOf,
                recurrence: configuration.jobs[n].recurrence,
                end: configuration.jobs[n].end,
                action: configuration.jobs[n].action.clientCopy()
            });
        }

        this.logDebug("Copying Data");

        for (var n in configuration.data) {
            copy.data.push(configuration.data[n].clientCopy());
        }

        return copy;
    };

    /**
     *
     * @param nodeConfigurationFile
     * @returns {*}
     */
    NodeManager.prototype.cleanConfigurationCopy = function (uuid) {
        return this.configurationsMap[uuid].configuration;
    };

    /**
     *
     * @param nodeConfigurationFile
     * @returns {*}
     */
    NodeManager.prototype.saveNodeConfiguration = function (uuid) {
        var nodeConfiguration = this.extractNodeConfiguration(uuid);

        nodeConfiguration.lastModificationTimestamp = moment().format();

        // Cache mangled Node Configuration

        // TODO Make more efficient - two times cloning

        this.configurationsMap[uuid].configuration = _.cloneDeep(nodeConfiguration);

        // Save unmangled configuration

        fs.writeFileSync(this.configurationsMap[uuid].filePath, "module.exports = " + JSON.stringify(this.unmangleNodeConfiguration(nodeConfiguration)) + ";", {
            encoding: "utf-8"
        });
    };

    /**
     *
     * @param nodeConfigurationFile
     * @returns {*}
     */
    NodeManager.prototype.extractNodeConfiguration = function (uuid) {
        var clientCopy = this.node.clientCopy();

        this.logDebug("Extract mangled Node Configuration for " + uuid);

        var nodeConfiguration = {
            uuid: uuid,
            id: this.configurationsMap[uuid].configuration.id,
            label: this.configurationsMap[uuid].configuration.id.label,
            autoDiscoveryDeviceTypes: utils.cloneDeep(this.node.autoDiscoveryDeviceTypes),
            devices: [],
            services: [],
            eventProcessors: [],
            jobs: [],
            groups: [],
            data: []
        };

        this.logDebug("Devices");

        for (var n in clientCopy.devices) {
            if (this.belongsToConfiguration(clientCopy.devices[n].id, uuid)) {
                nodeConfiguration.devices.push(clientCopy.devices[n]);
            }
        }

        this.logDebug("Services");

        for (var n in clientCopy.services) {
            if (this.belongsToConfiguration(clientCopy.services[n].id, uuid)) {
                nodeConfiguration.services.push(clientCopy.services[n]);
            }
        }

        this.logDebug("Event Processors");

        for (var n in clientCopy.eventProcessors) {
            if (this.belongsToConfiguration(clientCopy.eventProcessors[n].id, uuid)) {
                nodeConfiguration.eventProcessors.push(clientCopy.eventProcessors[n]);
            }
        }

        this.logDebug("Jobs");

        for (var n in clientCopy.jobs) {
            if (this.belongsToConfiguration(clientCopy.jobs[n].id, uuid)) {
                nodeConfiguration.jobs.push(clientCopy.jobs[n]);
            }
        }

        this.logDebug("Groups");

        for (var n in clientCopy.groups) {
            if (this.belongsToConfiguration(clientCopy.groups[n].id, uuid)) {
                nodeConfiguration.groups.push(clientCopy.groups[n]);
            }
        }

        return nodeConfiguration;
    };

    /**
     *
     * @param nodeConfigurationFile
     * @returns {*}
     */
    NodeManager.prototype.unmangleNodeConfiguration = function (nodeConfiguration) {
        this.logDebug("Unmangle Node Configuration");
        this.logDebug("Devices");

        for (var n in nodeConfiguration.devices) {
            nodeConfiguration.devices[n].id = this.unmangleId(nodeConfiguration.devices[n].id);
        }

        this.logDebug("Services");

        for (var n in nodeConfiguration.services) {
            nodeConfiguration.services[n].id = this.unmangleId(nodeConfiguration.services[n].id);
        }

        this.logDebug("Data");

        for (var n in nodeConfiguration.data) {
            nodeConfiguration.data[n].id = this.unmangleId(nodeConfiguration.data[n].id);
        }

        this.logDebug("Event Processors");

        for (var n in nodeConfiguration.eventProcessors) {
            nodeConfiguration.eventProcessors[n].id = this.unmangleId(nodeConfiguration.eventProcessors[n].id);

            this.unmangleAction(nodeConfiguration.eventProcessors[n].action);

            for (var m in nodeConfiguration.eventProcessors[n].observables) {
                nodeConfiguration.eventProcessors[n].observables[m] = this.unmangleId(nodeConfiguration.eventProcessors[n].observables[m]);
            }
        }

        this.logDebug("Jobs");

        for (var n in nodeConfiguration.jobs) {
            nodeConfiguration.jobs[n].id = this.unmangleId(nodeConfiguration.jobs[n].id);

            this.unmangleAction(nodeConfiguration.jobs[n].action);
        }

        this.logDebug("Groups");

        for (var n in nodeConfiguration.groups) {
            nodeConfiguration.groups[n].id = this.unmangleId(nodeConfiguration.groups[n].id);

            this.unmangleGroup(nodeConfiguration.groups[n])
        }

        return nodeConfiguration;
    };

    /**
     *
     * @param group
     */
    NodeManager.prototype.unmangleGroup = function (group) {
        for (var n in group.devices) {
            group.devices[n] = this.unmangleId(group.devices[n]);
        }

        for (var n in group.actors) {
            group.actors[n] = this.unmangleId(group.actors[n]);
        }

        for (var n in group.sensors) {
            group.sensors[n] = this.unmangleId(group.sensors[n]);
        }

        for (var n in group.services) {
            group.services[n] = this.unmangleId(group.services[n]);
        }

        for (var n in group.subGroups) {
            this.unmangleGroup(group.subGroups[n]);
        }
    };

    NodeManager.prototype.unmangleAction = function (action) {
        if (action.content.service) {
            action.content.service = this.unmangleId(action.content.service);
        }

        if (action.content.device) {
            action.content.device = this.unmangleId(action.content.device);
        }

        if (action.content.actor) {
            action.content.actor = this.unmangleId(action.content.actor);
        }

        if (action.content.setPointVariable.device) {
            action.content.setPointVariable.device = this.unmangleId(action.content.setPointVariable.device);
        }

        if (action.content.setPointVariable.data) {
            action.content.setPointVariable.data = this.unmangleId(action.content.setPointVariable.data);
        }

        if (action.content.controlVariable.device) {
            action.content.controlVariable.device = this.unmangleId(action.content.controlVariable.device);
        }

        if (action.content.controlVariable.data) {
            action.content.controlVariable.data = this.unmangleId(action.content.controlVariable.data);
        }
    };

    /**
     *
     */
    NodeManager.prototype.loadPlugins = function (additionalPluginDirectories) {
        this.devicePlugins = {};
        this.plugins = this.devicePlugins;
        this.unitPlugins = {};

        // Scan default Plugins

        if (fs.existsSync(__dirname
                + "/default-devices", "/lib/default-devices")) {
            this.scanDevicePluginDirectories(__dirname
                + "/default-devices", "/lib/default-devices");
        }

        // Scan embedded Plugins

        if (fs.existsSync(__dirname
                + "/../node_modules", "/node_modules")) {
            this.scanDevicePluginDirectories(__dirname
                + "/../node_modules", "/node_modules");
        }

        // Scan installed Plugins

        if (fs.existsSync(__dirname
                + "/../../../node_modules", "/node_modules")) {
            this.scanDevicePluginDirectories(__dirname
                + "/../../../node_modules", "/node_modules");
        }

        for (var n in additionalPluginDirectories) {
            this.scanDevicePluginDirectories(additionalPluginDirectories[n], "/node_modules");
        }

        // Collect units

        //this.scanUnitPluginDirectories(__dirname
        //    + "/default-units", "/lib/default-units");

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
                                throw "Module path \"" + pluginModulePath + "\" does not exist."
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
    NodeManager.prototype.initializeCommunication = function (options, app, io, namespace) {
        this.initializeCommunicationBasis(options, app, io, namespace)

        if (this.options.proxy && this.options.proxy !== "local") {
            this.initializeReverseProxy();
        }

        // Always needed for local access

        this.initializeWebSocket();
        this.initializeSecurityConfiguration();
        this.initializeRestServices();

    };

    /**
     *
     */
    NodeManager.prototype.initializeCommunicationBasis = function (options, app, io, namespace) {
        this.options = options;
        this.app = app;
        this.io = io;
        this.namespace = namespace;
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
            var configurations = [];

            for (var n in this.configurationsMap) {
                configurations.push({
                    uuid: n,
                    id: this.configurationsMap[n].id,
                    label: this.configurationsMap[n].label,
                });
            }

            getmac.getMac(function (error, macAddress) {
                if (error) {
                    this.logError("Cannot retrieve MAC address: " + error);

                    res.status(500).send(error);
                } else {
                    res.send({
                        server: "local",
                        uuid: this.uuid,
                        macAddress: macAddress,
                        configurations: configurations
                    });
                }
            }.bind(this));
        }.bind(this));
        this.app.post("/firmware", function (req, res) {
            this.updateFirmwareAndShutdown(req.body.currentFirmwareVersion).then(function () {
                res.send({});
            }.bind(this)).fail(function (error) {
                this.logError(error);

                res.status(500).send(error);
            }.bind(this));
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
            res.send(this.getState());

            // TODO May move to another URL

            this.node.poll();
        }.bind(this));
        this.app.get("/configuration", function (req, res) {
            // Send the plain configuration

            res.send({nodeBoxUuid: this.uuid, configuration: this.node.clientCopy()});
        }.bind(this));
        this.app
            .post(
                "/configure",
                function (req, res) {
                    this.logError("Should not be called anymore.");
                    //this.configure(req.body);
                    res.send("");
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
            this.stop().then(function () {
                res.send("");
            }.bind(this)).fail(function (error) {
                res.status(500).send(error);
            }.bind(this));
        }.bind(this));
        this.app.post("/poll", function (req, res) {
            this.node.poll();

            res.send("");
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
        this.app.get("/data/:data", function (req, res) {
            this.logDebug("Retrieving data [" + req.params.data + "].");

            res
                .send(this.node[req.params.data]);
        }.bind(this));
        this.app.post("/data/:data", function (req, res) {
            this.logDebug("Set data [" + req.params.data + "].");

            if (req.body['ti-primitive-wrapper']) {
                this.node[req.params.data] = req.body['ti-primitive-wrapper'];
            } else {
                this.node[req.params.data] = req.body;
            }

            // Save the changes

            this.node.findData(req.params.data).update(req.body).then(function (state) {
                res
                    .send(state);
            }.bind(this)).fail(function () {
                this.logError(error);

                res.status(500)
                    .send(error);
            }.bind(this));
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
        this.app.get("/devices/:device/state/:state/resource", function (req, res) {
            try {
                var device = this.node[req.params.device];

                if (!device) {
                    throw new Error("Cannot find device " + req.params.device);

                }

                if (!device.getResourceUrl) {
                    throw new Error("Device is missing method 'getResourceUrl()'");
                }

                var url = device.getResourceUrl(req.params.state);

                this.logDebug("URL", url);

                if (url.indexOf("http://") == 0 || url.indexOf("https://") == 0) {
                    request.get(url).pipe(res);
                } else {
                    var stat = fs.statSync(url);

                    res.writeHead(200, {
                        'Content-Type': 'video/mp4',
                        'Content-Length': stat.size
                    });

                    fs.createReadStream(url).pipe(res);
                }
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
        this.app.post("/devices/:device/register", function (req, res) {
            this.logInfo("Register device", req.params.device);

            if (!req.params.device) {
                res.status(500).end("Device undefined.");
            }
            else {
                if (!this.node.pendingDeviceRegistrations[req.params.device]) {
                    res.status(500).end("No Device [" + req.params.device + "] pending for registration.");
                }
                else {
                    var newDevice = this.node.pendingDeviceRegistrations[req.params.device];

                    this.logDebug("Device for registration found", newDevice);

                    this.node.createDevice(newDevice, this.defaultNodeConfiguration.uuid).then(function (device) {
                        delete this.node.pendingDeviceRegistrations[req.params.device];

                        this.logDebug("Send device creation");
                        res.send(device);
                        this.logDebug("Sent device creation");
                    }.bind(this)).fail(function (error) {
                        this.logError(error);
                        res.status(500).send(error);
                    }.bind(this));
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
        this.app.post("/configuration/devices", function (request, response) {
            if (!request.body.id) {
                response.status(500).send("No id specified for Device.");
            }
            else if (!request.body.plugin) {
                response.status(500).send("No Device Plugin specified for Device.");
            }

            this.node.createDevice(request.body).then(function () {
                this.node.publishNodeConfigurationChange(this.defaultNodeConfiguration.uuid, request.headers['client-token']);
                response.send(this.node.clientCopy());
            }.bind(this)).fail(function (error) {
                this.logError(error);
                response.status(500).send(error);
            }.bind(this));
        }.bind(this));
        this.app.put("/configuration/devices/:device", function (request, response) {
            this.node.updateDevice(request.params.device, request.body).then(function () {
                this.node.publishNodeConfigurationChange(this.defaultNodeConfiguration.uuid, request.headers['client-token']);
                response.send(this.node.clientCopy());
            }.bind(this)).fail(function (error) {
                this.logError(error);
                response.status(500).send(error);
            }.bind(this));
        }.bind(this));
        this.app.delete("/configuration/devices/:device", function (request, response) {
            this.node.deleteDevice(request.params.device).then(function () {
                this.node.publishNodeConfigurationChange(this.defaultNodeConfiguration.uuid, request.headers['client-token']);
                response.send(this.node.clientCopy());
            }.bind(this)).fail(function (error) {
                this.logError(error);
                response.status(500).send(error);
            }.bind(this));
        }.bind(this));

        // TODO Remove Actor/Sensor CRUD - covered by Device update

        this.app.post("/configuration/devices/:device/actors", function (request, response) {
            if (!request.body.id) {
                response.status(500).send("No id specified for Actor.");
            }
            else if (!request.body.type) {
                response.status(500).send("No Actor Plugin specified for Actor.");
            }

            this.node.createActor(request.params.device, request.body).then(function () {
                this.node.publishNodeConfigurationChange(this.defaultNodeConfiguration.uuid, request.headers['client-token']);
                response.send(this.node.clientCopy());
            }.bind(this)).fail(function (error) {
                this.logError(error);
                response.status(500).send(error);
            }.bind(this));
        }.bind(this));
        this.app.put("/configuration/devices/:device/actors/:actor", function (request, response) {
            this.node.updateActor(request.params.device, request.params.actor, request.body).then(function () {
                this.node.publishNodeConfigurationChange(this.defaultNodeConfiguration.uuid, request.headers['client-token']);
                response.send(this.node.clientCopy());
            }.bind(this)).fail(function (error) {
                this.logError(error);
                response.status(500).send(error);
            }.bind(this));
        }.bind(this));
        this.app.delete("/configuration/devices/:device/actors/:actor", function (request, response) {
            this.node.deleteActor(request.params.device, request.params.actor).then(function () {
                this.node.publishNodeConfigurationChange(this.defaultNodeConfiguration.uuid, request.headers['client-token']);
                response.send(this.node.clientCopy());
            }.bind(this)).fail(function (error) {
                this.logError(error);
                response.status(500).send(error);
            }.bind(this));
        }.bind(this));
        this.app.post("/configuration/devices/:device/sensors", function (request, response) {
            if (!request.body.id) {
                response.status(500).send("No id specified for Sensor.");
            }
            else if (!request.body.type) {
                response.status(500).send("No Sensor Plugin specified for Sensor.");
            }

            this.node.createSensor(request.params.device, request.body).then(function () {
                this.node.publishNodeConfigurationChange(this.defaultNodeConfiguration.uuid, request.headers['client-token']);
                response.send(this.node.clientCopy());
            }.bind(this)).fail(function (error) {
                this.logError(error);
                response.status(500).send(error);
            }.bind(this));
        }.bind(this));
        this.app.put("/configuration/devices/:device/sensors/:sensor", function (request, response) {
            this.node.updateSensor(request.params.device, request.params.sensor, request.body).then(function () {
                this.node.publishNodeConfigurationChange(this.defaultNodeConfiguration.uuid, request.headers['client-token']);
                response.send(this.node.clientCopy());
            }.bind(this)).fail(function (error) {
                this.logError(error);
                response.status(500).send(error);
            }.bind(this));
        }.bind(this));
        this.app.delete("/configuration/devices/:device/sensors/:sensor", function (request, response) {
            this.node.deleteSensor(request.params.device, request.params.sensor).then(function () {
                this.node.publishNodeConfigurationChange(this.defaultNodeConfiguration.uuid, request.headers['client-token']);
                response.send(this.node.clientCopy());
            }.bind(this)).fail(function (error) {
                this.logError(error);
                response.status(500).send(error);
            }.bind(this));
        }.bind(this));
        this.app.post("/configuration/services", function (request, response) {
            if (!request.body.id) {
                response.status(500).send("No id specified for Service.");
            }

            this.node.createService(request.body).then(function (service) {
                this.node.publishNodeConfigurationChange(this.defaultNodeConfiguration.uuid, request.headers['client-token']);
                response.send(this.node.clientCopy());
            }.bind(this)).fail(function (error) {
                this.logError(error);
                response.status(500).send(error);
            }.bind(this));
        }.bind(this));
        this.app.put("/configuration/services/:service", function (request, response) {
            this.node.updateService(request.params.service, request.body).then(function () {
                this.node.publishNodeConfigurationChange(this.defaultNodeConfiguration.uuid, request.headers['client-token']);
                response.send(this.node.clientCopy());
            }.bind(this)).fail(function (error) {
                this.logError(error);
                response.status(500).send(error);
            }.bind(this));
        }.bind(this));
        this.app.delete("/configuration/services/:service", function (request, response) {
            this.node.deleteService(request.params.service).then(function () {
                this.node.publishNodeConfigurationChange(this.defaultNodeConfiguration.uuid, request.headers['client-token']);
                response.send(this.node.clientCopy());
            }.bind(this)).fail(function (error) {
                this.logError(error);
                response.status(500).send(error);
            }.bind(this));
        }.bind(this));
        this.app.post("/configuration/groups", function (request, response) {
            if (!request.body.id) {
                response.status(500).send("No id specified for Group.");
            }

            this.node.createGroup(request.body).then(function (group) {
                this.node.publishNodeConfigurationChange(this.defaultNodeConfiguration.uuid, request.headers['client-token']);
                response.send(this.node.clientCopy());
            }.bind(this)).fail(function (error) {
                this.logError(error);
                response.status(500).send(error);
            }.bind(this));
        }.bind(this));
        this.app.put("/configuration/groups/:group", function (request, response) {
            this.node.updateGroup(request.params.group, request.body).then(function () {
                this.node.publishNodeConfigurationChange(this.defaultNodeConfiguration.uuid, request.headers['client-token']);
                response.send(this.node.clientCopy());
            }.bind(this)).fail(function (error) {
                this.logError(error);
                response.status(500).send(error);
            }.bind(this));
        }.bind(this));
        this.app.delete("/configuration/groups/:group", function (request, response) {
            this.node.deleteGroup(request.params.group).then(function () {
                this.node.publishNodeConfigurationChange(this.defaultNodeConfiguration.uuid, request.headers['client-token']);
                response.send(this.node.clientCopy());
            }.bind(this)).fail(function (error) {
                this.logError(error);
                response.status(500).send(error);
            }.bind(this));
        }.bind(this));
        this.app.post("/configuration/eventProcessors", function (request, response) {
            if (!request.body.id) {
                response.status(500).send("No id specified for Event Processor.");
            }

            this.node.createEventProcessor(request.body).then(function (eventProcessor) {
                this.node.publishNodeConfigurationChange(this.defaultNodeConfiguration.uuid, request.headers['client-token']);
                response.send(this.node.clientCopy());
            }.bind(this)).fail(function (error) {
                this.logError(error);
                response.status(500).send(error);
            }.bind(this));
        }.bind(this));
        this.app.put("/configuration/eventProcessors/:eventProcessor", function (request, response) {
            this.node.updateEventProcessor(request.params.eventProcessor, request.body).then(function () {
                this.node.publishNodeConfigurationChange(this.defaultNodeConfiguration.uuid, request.headers['client-token']);
                response.send(this.node.clientCopy());
            }.bind(this)).fail(function (error) {
                this.logError(error);
                response.status(500).send(error);
            }.bind(this));
        }.bind(this));
        this.app.delete("/configuration/eventProcessors/:eventProcessor", function (request, response) {
            this.node.deleteEventProcessor(request.params.eventProcessor).then(function () {
                this.node.publishNodeConfigurationChange(this.defaultNodeConfiguration.uuid, request.headers['client-token']);
                response.send(this.node.clientCopy());
            }.bind(this)).fail(function (error) {
                this.logError(error);
                response.status(500).send(error);
            }.bind(this));
        }.bind(this));
        this.app.post("/configuration/storyboards", function (request, response) {
            if (!request.body.id) {
                response.status(500).send("No id specified for Storyboard.");
            }

            this.node.createStoryboard(request.body).then(function (storyboard) {
                this.node.publishNodeConfigurationChange(this.defaultNodeConfiguration.uuid, request.headers['client-token']);
                response.send(this.node.clientCopy());
            }.bind(this)).fail(function (error) {
                this.logError(error);
                response.status(500).send(error);
            }.bind(this));
        }.bind(this));
        this.app.put("/configuration/storyboards/:storyboard", function (request, response) {
            this.node.updateStoryboard(request.params.storyboard, request.body).then(function () {
                this.node.publishNodeConfigurationChange(this.defaultNodeConfiguration.uuid, request.headers['client-token']);
                response.send(this.node.clientCopy());
            }.bind(this)).fail(function (error) {
                this.logError(error);
                response.status(500).send(error);
            }.bind(this));
        }.bind(this));
        this.app.delete("/configuration/storyboards/:storyboard", function (request, response) {
            this.node.deleteStoryboard(request.params.storyboard).then(function () {
                this.node.publishNodeConfigurationChange(this.defaultNodeConfiguration.uuid, request.headers['client-token']);
                response.send(this.node.clientCopy());
            }.bind(this)).fail(function (error) {
                this.logError(error);
                response.status(500).send(error);
            }.bind(this));
        }.bind(this));
        this.app.post("/configuration/jobs", function (request, response) {
            if (!request.body.id) {
                response.status(500).send("No id specified for Job.");
            }

            this.node.createJob(request.body).then(function (job) {
                this.node.publishNodeConfigurationChange(this.defaultNodeConfiguration.uuid, request.headers['client-token']);
                response.send(this.node.clientCopy());
            }.bind(this)).fail(function (error) {
                this.logError(error);
                response.status(500).send(error);
            }.bind(this));
        }.bind(this));
        this.app.put("/configuration/jobs/:job", function (request, response) {
            this.node.updateJob(request.params.job, request.body).then(function () {
                this.node.publishNodeConfigurationChange(this.defaultNodeConfiguration.uuid, request.headers['client-token']);
                response.send(this.node.clientCopy());
            }.bind(this)).fail(function (error) {
                this.logError(error);
                response.status(500).send(error);
            }.bind(this));
        }.bind(this));
        this.app.delete("/configuration/jobs/:job", function (request, response) {
            this.node.deleteJob(request.params.job).then(function () {
                this.node.publishNodeConfigurationChange(this.defaultNodeConfiguration.uuid, request.headers['client-token']);
                response.send(this.node.clientCopy());
            }.bind(this)).fail(function (error) {
                this.logError(error);
                response.status(500).send(error);
            }.bind(this));
        }.bind(this));
        this.app
            .post(
                "/files",
                function (req, res) {
                    try {
                        var busboy = new Busboy({
                            headers: req.headers
                        });
                        var fileName;

                        busboy
                            .on(
                                'file',
                                function (fieldname, file,
                                          fileName, encoding,
                                          mimetype) {

                                    if (!fs
                                            .existsSync(this.options.dataDirectory
                                                + "/files")) {
                                        fs
                                            .mkdirSync(this.options.dataDirectory
                                                + "/files");
                                    }

                                    file
                                        .on(
                                            'end',
                                            function () {
                                                this
                                                    .logDebug("Finished writing file.");
                                                // res
                                                // .writeHead(
                                                // 303,
                                                // {
                                                // Connection
                                                // :
                                                // 'close'
                                                // });
                                                res
                                                    .end(fileName);
                                            }.bind(this));

                                    this
                                        .logDebug("Start writing to "
                                            + this.options.dataDirectory
                                            + "/files/"
                                            + fileName);

                                    file
                                        .pipe(fs
                                            .createWriteStream(this.options.dataDirectory
                                                + "/files/"
                                                + fileName));
                                }.bind(this));
                        busboy.on('finish', function () {
                            // res.writeHead(303, {
                            // Connection : 'close'
                            // });
                            // res.end();
                        }.bind(this));

                        req.pipe(busboy);
                    } catch (error) {
                        this.logError(error);

                        res.status(500).send(error);
                    }
                }.bind(this));
        this.app
            .post(
                "/pair",
                function (req, res) {
                    try {
                        this.pair(req.body.mesh, req.headers['ti-sid'], req.body.account, req.body.password, req.body.server, true).then(function (gateway) {
                            res.send(gateway);
                        }.bind(this)).fail(function (error) {
                            res.status(500).send(error);
                        }.bind(this));
                    } catch (error) {
                        this.logError(error);

                        res.status(500).send(error);
                    }
                }.bind(this));
    };

    /**
     *
     * @param meshLabel
     * @param sid
     * @param account
     * @param password
     * @returns {*|promise}
     */
    NodeManager.prototype.pair = function (meshLabel, sid, account, password, server, restart) {
        var deferred = q.defer();

        getmac.getMac(function (error, macAddress) {
            if (error) {
                this.logError("Cannot retrieve MAC address: " + error);

                deferred.reject("Cannot retrieve MAC address: " + error);
            } else {
                var mesh;
                var uuids = [];

                if (meshLabel) {
                    mesh = {
                        id: meshLabel,
                        label: meshLabel,
                        nodes: []
                    };

                    for (var n in this.configurationsMap) {
                        mesh.nodes.push(this.unmangleNodeConfiguration(_.cloneDeep(this.configurationsMap[n].configuration)));

                        // Relying on the order of configurations from now on

                        uuids.push(n);

                        this.logDebug('Adding Configuration [' + n + '] from File [' + this.configurationsMap[n].filePath + ']');
                    }
                }

                if (!server) {
                    server = "https://www.thing-it.com";
                }

                request.post({
                    headers: sid ? {'ti-sid': sid} : {},
                    url: server + "/gateways/pair",
                    json: true,
                    body: {account: account, password: password, macAddress: macAddress, mesh: mesh}
                }, function (error, response, body) {
                    if (error) {
                        this.logError(error);
                        deferred.reject("Cannot reach server.");
                    }
                    else {
                        if (response.statusCode == "401") {
                            deferred.reject("Access denied.");
                        }
                        else if (response.statusCode == "200") {
                            var gateway = body.nodeComputer;

                            this.options.uuid = gateway.uuid;
                            this.options.proxy = server;

                            this.logDebug("Updating Options File [" + process.cwd() + "/options.js]");

                            fs.writeFileSync(process.cwd() + "/options.js", "module.exports = " + JSON.stringify(this.options) + ";", {
                                encoding: "utf-8"
                            });

                            for (var n in body.mesh.nodes) {
                                var entry = this.configurationsMap[uuids[n]];

                                body.mesh.nodes[n].customer = body.customer;
                                body.mesh.nodes[n].mesh = body.mesh.uuid;

                                this.logDebug("Updating Gateway Configuration [" + body.mesh.nodes[n].uuid + '] in File [' + entry.filePath + "]");

                                fs.writeFileSync(entry.filePath, "module.exports = " + JSON.stringify(body.mesh.nodes[n]) + ";", {
                                    encoding: "utf-8"
                                });

                                // Only needed for restart
                                // TODO Probably not needed

                                //if (restart) {
                                //    this.configurationsMap[body.mesh.nodes[n].uuid] = {
                                //        configuration: body.mesh.nodes[n],
                                //        filePath: entry.filePath
                                //    };
                                //
                                //    delete this.configurationsMap[uuids[n]];
                                //
                                //    this.nameMangleNodeConfiguration(body.mesh.nodes[n]);
                                //}
                            }

                            this.reloadAndRestart();

                            deferred.resolve(gateway);
                        } else {
                            deferred.reject("Server error.");
                        }
                    }
                }.bind(this));
            }
        }.bind(this));

        return deferred.promise;
    };

    /**
     *
     * @returns {*|promise}
     */
    NodeManager.prototype.updateFirmwareAndShutdown = function (currentFirmwareVersion) {
        this.logInfo("Updating Firmware and shutting down. This requires for you to have a watchdog (e.g. forever) running for " +
            "[thing-it-node] to come up again after. May also require [thing-it-node] to be started as sudo/root.");

        var deferred = q.defer();

        if (docker.container()) {

            this.logInfo("Node runs as docker container: " + docker.container());

            docker.download(this.options.watchdog, currentFirmwareVersion).then(function (){
                docker.getImage(currentFirmwareVersion).then(function (image){
                    if (image) {
                        docker.update(this.options.watchdog, currentFirmwareVersion);
                    }
                }.bind(this))
            }.bind(this));

            deferred.resolve();

        } else {

            var exec = require('child_process').exec;
            var child = exec('npm update thing-it-node -g', function (error, stdout, stderr) {
                this.logInfo("*** Output of Firmware Upgrade ***\n" + stdout);
                this.logInfo("*** Errors/Warnings of Firmware Upgrade ***\n" + stderr);

                if (error !== null) {
                    this.logError("Firmware update was not successful.", error);
                } else {
                    process.exit(0);
                }
            }.bind(this));

            // Return after install is initialized for now
            deferred.resolve();
        }

        return deferred.promise;
    };

    /**
     *
     */
    NodeManager.prototype.initializeWebSocket = function () {
        this.logInfo("Initializing Web Socket for event dispatching at " + this.namespacePrefix + "/events");

        // Open namespace for web socket connections

        if (!this.namespace) {
            this.namespace = this.io.of(this.namespacePrefix + "/events");
        }

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

        var reverseProxyNamespaceUrl = this.options.proxy + "/proxies/" + this.uuid;
        var connectInProgress = false;

        this.connectInterval = setInterval(function () {
            this.logInfo("(Re)try initial NS connection for " + reverseProxyNamespaceUrl);

            // Blocks interval body execution if a previously instantiated one is not yet completed

            if (connectInProgress) {
                this.logInfo("Connect still in progress");

                return;
            }

            connectInProgress = true;

            if (this.reverseProxyNamespace) {
                this.logInfo("Remove all listeners on retry");
                this.reverseProxyNamespace.removeAllListeners();
            }

            getmac.getMac(function (error, macAddress) {
                if (error) {
                    this.logError("Cannot retrieve MAC address: " + error);

                    connectInProgress = false;

                    throw error;
                }

                request.post({
                    url: this.options.proxy + "/proxies/" + this.options.uuid, json: true,
                    body: {nodeBoxUuid: this.options.uuid, macAddress: macAddress}
                }, function (error, response, body) {
                    if (error) {
                        connectInProgress = false;

                        this.logInfo("Cannot reach server");
                    }
                    else {
                        this.logInfo("Server notified", body);

                        if (body.paired) {
                            this.logInfo("Reverse Proxy prepared on server.");

                            // TODO Delete if current approach consolidates

                            // SocketIO reconnect semantics seem not to work as we need them

                            // this.reverseProxyNamespace = socketIoClient.connect(reverseProxyNamespaceUrl, {
                            //     //reconnection: true,
                            //     //reconnectionAttempts: "Infinity",
                            //     //reconnectionDelay: 5000,
                            //     //reconnectionDelayMax: 5000,
                            //     //randomizationFactor: 0
                            //     reconnection: false,
                            //     "force new connection": true
                            // });

                            this.reverseProxyNamespace = socketIoClient(reverseProxyNamespaceUrl);

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
                                    this.logInfo("UUID: " + request.uuid);
                                    this.logInfo("Node UUID: " + request.nodeUuid);
                                    this.logInfo("Node Box UUID: " + request.nodeBoxUuid);
                                    this.logInfo("User: " + request.user);
                                    this.logInfo("Method: " + request.method);
                                    this.logInfo("Path  : " + request.path);
                                    this.logInfo("Client Token  : ", request.headers['client-token']);
                                    this.logInfo("Body  : ", request.body);

                                    // Mini middleware

                                    try {
                                        var details = null;

                                        if ((details = this.matchRequestPath(request.path, "/nodes/:node/firmware")) && request.method === "POST") {
                                            this.updateFirmwareAndShutdown(request.body.currentFirmwareVersion).then(function () {
                                                this.reverseProxyNamespace.emit("httpResponse", {
                                                    uuid: request.uuid,
                                                    status: 0
                                                });
                                            }.bind(this)).fail(function (error) {
                                                this.logError(error);

                                                throw error;
                                            }.bind(this));
                                        }
                                        else if ((details = this.matchRequestPath(request.path, "/nodes/:node/plugins")) && request.method === "GET") {
                                            this.reverseProxyNamespace.emit("httpResponse", {
                                                uuid: request.uuid,
                                                status: 0,
                                                data: this.devicePlugins
                                            });
                                        }
                                        else if ((details = this.matchRequestPath(request.path, "/nodes/:node/state")) && request.method === "GET") {
                                            this.reverseProxyNamespace.emit("httpResponse", {
                                                uuid: request.uuid,
                                                status: 0, data: this.getState(details.params.node)
                                            });

                                            this.node.poll();
                                        }
                                        else if ((details = this.matchRequestPath(request.path, "/nodes/:node/configuration")) && request.method === "GET") {
                                            this.reverseProxyNamespace.emit("httpResponse", {
                                                uuid: request.uuid,
                                                status: 0, data: {
                                                    state: this.state,
                                                    nodeBoxUuid: this.uuid,
                                                    //configuration: this.cleanConfigurationCopy(request.nodeUuid)
                                                    configuration: this.unmangleNodeConfiguration(_.cloneDeep(this.cleanConfigurationCopy(details.params.node)))
                                                }
                                            });

                                            this.logDebug("Configuration emitted.");
                                        }
                                        else if ((details = this.matchRequestPath(request.path, "/nodes/:node/configurationUnmangled")) && request.method === "GET") {
                                            this.reverseProxyNamespace.emit("httpResponse", {
                                                uuid: request.uuid,
                                                status: 0, data: {
                                                    state: this.state,
                                                    nodeBoxUuid: this.uuid,

                                                    // Could alternatively read from file

                                                    configuration: this.unmangleNodeConfiguration(_.cloneDeep(this.cleanConfigurationCopy(details.params.node)))
                                                }
                                            });

                                            this.logDebug("Configuration emitted.");
                                        }
                                        else if ((details = this.matchRequestPath(request.path, "/nodes/:node/poll"))) {
                                            this.node.poll();
                                            this.reverseProxyNamespace.emit("httpResponse", {
                                                uuid: request.uuid,
                                                status: 0
                                            });
                                        }
                                        else if ((details = this.matchRequestPath(request.path, "/nodes/:node/configure"))) {
                                            this.node.emitNodeConfigurationChange(request.nodeUuid, request.headers['client-token']);
                                            this.updateNodeConfiguration(request.nodeUuid, request.body);
                                            this.reverseProxyNamespace.emit("httpResponse", {
                                                uuid: request.uuid,
                                                status: 0
                                            });
                                        }
                                        else if ((details = this.matchRequestPath(request.path, "/nodes/:node/start"))) {
                                            this.start().then(function () {
                                                this.reverseProxyNamespace.emit("httpResponse", {
                                                    uuid: request.uuid,
                                                    status: 0
                                                });
                                            }.bind(this)).fail(function (error) {
                                                this.logError(error);

                                                throw error;
                                            }.bind(this));
                                        }
                                        else if ((details = this.matchRequestPath(request.path, "/nodes/:node/stop"))) {
                                            this.stop().then(function () {
                                                this.reverseProxyNamespace.emit("httpResponse", {
                                                    uuid: request.uuid,
                                                    status: 0
                                                });
                                            }.bind(this)).fail(function (error) {
                                                this.logError(error);

                                                throw error;
                                            }.bind(this));
                                        }
                                        else if ((details = this.matchRequestPath(request.path, "/nodes/:node/restart"))) {
                                            this.restart().then(function () {
                                                this.reverseProxyNamespace.emit("httpResponse", {
                                                    uuid: request.uuid,
                                                    status: 0
                                                });
                                            }.bind(this)).fail(function (error) {
                                                this.logError(error);

                                                throw error;
                                            }.bind(this));
                                        }
                                        else if ((details = this.matchRequestPath(request.path, "/nodes/:node/devices/:device/streams/:stream"))) {
                                            this.reverseProxyNamespace.emit("httpResponse", {
                                                uuid: request.uuid,
                                                status: 0
                                            });
                                        }
                                        else if ((details = this.matchRequestPath(request.path, "/nodes/:node/devices/:device/register"))) {
                                            this.reverseProxyNamespace.emit("httpResponse", {
                                                uuid: request.uuid,
                                                status: 0
                                            });
                                        }
                                        else if ((details = this.matchRequestPath(request.path, "/nodes/:node/devices/:device/discard"))) {
                                            this.reverseProxyNamespace.emit("httpResponse", {
                                                uuid: request.uuid,
                                                status: 0
                                            });
                                        }
                                        else if ((details = this.matchRequestPath(request.path, "/nodes/:node/services/:service"))) {
                                            if (!this.node[this.mangleId(details.params.node, details.params.service)]) {
                                                throw "Service [" + details.params.service + "] does not exist";
                                            }
                                            else {
                                                this.logDebug("Invoking service [" + details.params.service + "] on Node.");

                                                var parameters = request.body ? request.body : {};

                                                parameters.__header = {user: request.user};

                                                this.logDebug("Parameters", parameters);

                                                try {
                                                    this.node[this.mangleId(details.params.node, details.params.service)](parameters);

                                                    this.reverseProxyNamespace.emit("httpResponse", {
                                                        uuid: request.uuid,
                                                        status: 0
                                                    });
                                                } catch (error) {
                                                    this.reverseProxyNamespace.emit("httpError", {
                                                        uuid: request.uuid,
                                                        status: 500,
                                                        error: "Error executing Service [" + details.params.service + "]: " + error
                                                    });
                                                }
                                            }
                                        }
                                        else if ((details = this.matchRequestPath(request.path, "/nodes/:node/devices/:device/services/:service"))) {
                                            // TODO Inhomogenous with node services

                                            this.logDebug("Invoking service [" + details.params.service + "] on Device [" +
                                                details.params.device + "].");
                                            this.node[this.mangleId(details.params.node, details.params.device)][details.params.service](request.body);

                                            this.reverseProxyNamespace.emit("httpResponse", {
                                                uuid: request.uuid,
                                                status: 0
                                            });
                                        }
                                        else if ((details = this.matchRequestPath(request.path, "/nodes/:node/devices/:device/actors/:actor/services/:service"))) {
                                            // TODO Inhomogenous with node services

                                            this.logDebug("Invoking service [" + details.params.service + "] on Actor [" +
                                                details.params.actor + "] on Device [" + this.unmangleId(details.params.device) + "].");
                                            this.node[this.mangleId(details.params.node, details.params.device)][details.params.actor][details.params.service](request.body);

                                            this.reverseProxyNamespace.emit("httpResponse", {
                                                uuid: request.uuid,
                                                status: 0
                                            });
                                        }
                                        else if ((details = this.matchRequestPath(request.path, "/nodes/:node/storyboards/:storyboard/:operation"))) {
                                            this.logDebug("Invoking operation [" + details.params.operation + "] on Node Service [" + details.params.storyboard + "].");

                                            if (details.params.operation != "play" && details.params.operation != "pause" && details.params.operation != "stop") {
                                                this.reverseProxyNamespace.emit("httpError", {
                                                    uuid: request.uuid,
                                                    status: 500,
                                                    error: "Storyboard operation unknown."
                                                });
                                            }
                                            else {
                                                this.node.findService(this.mangleId(details.params.node, details.params.storyboard))[details.params.operation]();
                                                this.reverseProxyNamespace.emit("httpResponse", {
                                                    uuid: request.uuid,
                                                    status: 0
                                                });
                                            }
                                        }
                                        else if ((details = this.matchRequestPath(request.path, "/nodes/:node/data/:data")) && request.method === "GET") {
                                            this.reverseProxyNamespace.emit("httpResponse", {
                                                uuid: request.uuid,
                                                status: 0,
                                                data: this.node.findData(this.mangleId(details.params.node, details.params.data)).wrap()
                                            });
                                        }
                                        else if ((details = this.matchRequestPath(request.path, "/nodes/:node/data/:data")) && request.method === "PUT") {
                                            var value = request.body;

                                            if (request.body['ti-primitive-wrapper']) {
                                                value = request.body['ti-primitive-wrapper'];
                                            }

                                            this.node.findData(this.mangleId(details.params.node, details.params.data)).update(value).then(function (value) {
                                                this.reverseProxyNamespace.emit("httpResponse", {
                                                    uuid: request.uuid,
                                                    status: 0,
                                                    data: value
                                                });
                                            }.bind(this)).fail(function (error) {
                                                this.reverseProxyNamespace.emit("httpError", {
                                                    uuid: request.uuid,
                                                    status: 500,
                                                    error: error
                                                });

                                            }.bind(this));
                                        }
                                        else if ((details = this.matchRequestPath(request.path, "/nodes/:node/pushAllStates")) && request.method === "POST") {
                                            this.node.pushAllStates();
                                        }
                                        else if ((details = this.matchRequestPath(request.path, "/nodes/:node/configuration/devices")) && request.method === "POST") {
                                            if (!request.body.id) {
                                                this.reverseProxyNamespace.emit("httpError", {
                                                    uuid: request.uuid,
                                                    status: 500,
                                                    error: "No id specified for Device."
                                                });
                                            }
                                            else if (!request.body.plugin) {
                                                this.reverseProxyNamespace.emit("httpError", {
                                                    uuid: request.uuid,
                                                    status: 500,
                                                    error: "No Device Plugin specified for Device."
                                                });
                                            }

                                            this.node.createDevice(request.body, request.nodeUuid).then(function () {
                                                this.node.publishNodeConfigurationChange(request.nodeUuid, request.headers['client-token']);
                                                this.reverseProxyNamespace.emit("httpResponse", {
                                                    uuid: request.uuid,
                                                    status: 0,
                                                    data: this.cleanConfigurationCopy(request.nodeUuid)
                                                });
                                            }.bind(this)).fail(function (error) {
                                                this.logError(error);

                                                throw error;
                                            }.bind(this));
                                        }
                                        else if ((details = this.matchRequestPath(request.path, "/nodes/:node/configuration/devices/:device")) && request.method === "PUT") {
                                            this.node.updateDevice(details.params.device, request.body, request.nodeUuid).then(function () {
                                                this.node.publishNodeConfigurationChange(request.nodeUuid, request.headers['client-token']);
                                                this.reverseProxyNamespace.emit("httpResponse", {
                                                    uuid: request.uuid,
                                                    status: 0,
                                                    data: this.cleanConfigurationCopy(request.nodeUuid)
                                                });
                                            }.bind(this)).fail(function (error) {
                                                this.logError(error);

                                                throw error;
                                            }.bind(this));
                                        }
                                        else if ((details = this.matchRequestPath(request.path, "/nodes/:node/configuration/devices/:device")) && request.method === "DELETE") {
                                            this.node.deleteDevice(details.params.device, request.nodeUuid).then(function () {
                                                this.node.publishNodeConfigurationChange(request.nodeUuid, request.headers['client-token']);
                                                this.reverseProxyNamespace.emit("httpResponse", {
                                                    uuid: request.uuid,
                                                    status: 0,
                                                    data: this.cleanConfigurationCopy(request.nodeUuid)
                                                });
                                            }.bind(this)).fail(function (error) {
                                                this.logError(error);

                                                throw error;
                                            }.bind(this));
                                        }

                                        // TODO Remove Actor/Sensor CRUD - covered by Device update

                                        else if ((details = this.matchRequestPath(request.path, "/nodes/:node/configuration/devices/:device/actors")) && request.method === "POST") {
                                            if (!request.body.id) {
                                                this.reverseProxyNamespace.emit("httpError", {
                                                    uuid: request.uuid,
                                                    status: 500,
                                                    error: "No id specified for Actor."
                                                });
                                            }
                                            else if (!request.body.type) {
                                                this.reverseProxyNamespace.emit("httpError", {
                                                    uuid: request.uuid,
                                                    status: 500,
                                                    error: "No Actor Plugin specified for Actor."
                                                });
                                            }

                                            this.node.createActor(details.params.device, request.body, request.nodeUuid).then(function () {
                                                this.node.publishNodeConfigurationChange(request.nodeUuid, request.headers['client-token']);
                                                this.reverseProxyNamespace.emit("httpResponse", {
                                                    uuid: request.uuid,
                                                    status: 0,
                                                    data: this.cleanConfigurationCopy(request.nodeUuid)
                                                });
                                            }.bind(this)).fail(function (error) {
                                                this.logError(error);

                                                throw error;
                                            }.bind(this));
                                        }
                                        else if ((details = this.matchRequestPath(request.path, "/nodes/:node/configuration/devices/:device/actors/:actor")) && request.method === "PUT") {
                                            this.node.updateActor(details.params.device, details.params.actor, request.body, request.nodeUuid).then(function () {
                                                this.node.publishNodeConfigurationChange(request.nodeUuid, request.headers['client-token']);
                                                this.reverseProxyNamespace.emit("httpResponse", {
                                                    uuid: request.uuid,
                                                    status: 0,
                                                    data: this.cleanConfigurationCopy(request.nodeUuid)
                                                });
                                            }.bind(this)).fail(function (error) {
                                                this.logError(error);

                                                throw error;
                                            }.bind(this));
                                        }
                                        else if ((details = this.matchRequestPath(request.path, "/nodes/:node/configuration/devices/:device/actors/:actor")) && request.method === "DELETE") {
                                            this.node.deleteActor(details.params.device, details.params.actor, request.nodeUuid).then(function () {
                                                this.node.publishNodeConfigurationChange(request.nodeUuid, request.headers['client-token']);
                                                this.reverseProxyNamespace.emit("httpResponse", {
                                                    uuid: request.uuid,
                                                    status: 0,
                                                    data: this.cleanConfigurationCopy(request.nodeUuid)
                                                });
                                            }.bind(this)).fail(function (error) {
                                                this.logError(error);

                                                throw error;
                                            }.bind(this));
                                        }
                                        else if ((details = this.matchRequestPath(request.path, "/nodes/:node/configuration/devices/:device/sensors")) && request.method === "POST") {
                                            if (!request.body.id) {
                                                this.reverseProxyNamespace.emit("httpError", {
                                                    uuid: request.uuid,
                                                    status: 500,
                                                    error: "No id specified for Sensor."
                                                });
                                            }
                                            else if (!request.body.type) {
                                                this.reverseProxyNamespace.emit("httpError", {
                                                    uuid: request.uuid,
                                                    status: 500,
                                                    error: "No Sensor Plugin specified for Sensor."
                                                });
                                            }

                                            this.node.createSensor(details.params.device, request.body, request.nodeUuid).then(function () {
                                                this.node.publishNodeConfigurationChange(request.nodeUuid, request.headers['client-token']);
                                                this.reverseProxyNamespace.emit("httpResponse", {
                                                    uuid: request.uuid,
                                                    status: 0,
                                                    data: this.cleanConfigurationCopy(request.nodeUuid)
                                                });
                                            }.bind(this)).fail(function (error) {
                                                this.logError(error);

                                                throw error;
                                            }.bind(this));
                                        }
                                        else if ((details = this.matchRequestPath(request.path, "/nodes/:node/configuration/devices/:device/sensors/:sensor")) && request.method === "PUT") {
                                            this.node.updateSensor(details.params.device, details.params.sensor, request.body, request.nodeUuid).then(function () {
                                                this.node.publishNodeConfigurationChange(request.nodeUuid, request.headers['client-token']);
                                                this.reverseProxyNamespace.emit("httpResponse", {
                                                    uuid: request.uuid,
                                                    status: 0,
                                                    data: this.cleanConfigurationCopy(request.nodeUuid)
                                                });
                                            }.bind(this)).fail(function (error) {
                                                this.logError(error);

                                                throw error;
                                            }.bind(this));
                                        }
                                        else if ((details = this.matchRequestPath(request.path, "/nodes/:node/configuration/devices/:device/sensors/:sensor")) && request.method === "DELETE") {
                                            this.node.deleteSensor(details.params.device, details.params.sensor, request.nodeUuid).then(function () {
                                                this.node.publishNodeConfigurationChange(request.nodeUuid, request.headers['client-token']);
                                                this.reverseProxyNamespace.emit("httpResponse", {
                                                    uuid: request.uuid,
                                                    status: 0,
                                                    data: this.cleanConfigurationCopy(request.nodeUuid)
                                                });
                                            }.bind(this)).fail(function (error) {
                                                this.logError(error);

                                                throw error;
                                            }.bind(this));
                                        }
                                        else if ((details = this.matchRequestPath(request.path, "/nodes/:node/configuration/services")) && request.method === "POST") {
                                            if (!request.body.id) {
                                                this.reverseProxyNamespace.emit("httpError", {
                                                    uuid: request.uuid,
                                                    status: 500,
                                                    error: "No id specified for Service."
                                                });
                                            }

                                            this.node.createService(request.body, request.nodeUuid).then(function () {
                                                this.node.publishNodeConfigurationChange(request.nodeUuid, request.headers['client-token']);
                                                this.reverseProxyNamespace.emit("httpResponse", {
                                                    uuid: request.uuid,
                                                    status: 0,
                                                    data: this.cleanConfigurationCopy(request.nodeUuid)
                                                });
                                            }.bind(this)).fail(function (error) {
                                                this.logError(error);

                                                throw error;
                                            }.bind(this));
                                        }
                                        else if ((details = this.matchRequestPath(request.path, "/nodes/:node/configuration/services/:service")) && request.method === "PUT") {
                                            this.node.updateService(details.params.service, request.body, request.nodeUuid).then(function () {
                                                this.node.publishNodeConfigurationChange(request.nodeUuid, request.headers['client-token']);
                                                this.reverseProxyNamespace.emit("httpResponse", {
                                                    uuid: request.uuid,
                                                    status: 0,
                                                    data: this.cleanConfigurationCopy(request.nodeUuid)
                                                });
                                            }.bind(this)).fail(function (error) {
                                                this.logError(error);

                                                throw error;
                                            }.bind(this));
                                        }
                                        else if ((details = this.matchRequestPath(request.path, "/nodes/:node/configuration/services/:service")) && request.method === "DELETE") {
                                            this.node.deleteService(details.params.service, request.nodeUuid).then(function () {
                                                this.node.publishNodeConfigurationChange(request.nodeUuid, request.headers['client-token']);
                                                this.reverseProxyNamespace.emit("httpResponse", {
                                                    uuid: request.uuid,
                                                    status: 0,
                                                    data: this.cleanConfigurationCopy(request.nodeUuid)
                                                });
                                            }.bind(this)).fail(function (error) {
                                                this.logError(error);

                                                throw error;
                                            }.bind(this));
                                        }
                                        else if ((details = this.matchRequestPath(request.path, "/nodes/:node/configuration/groups")) && request.method === "POST") {
                                            if (!request.body.id) {
                                                this.reverseProxyNamespace.emit("httpError", {
                                                    uuid: request.uuid,
                                                    status: 500,
                                                    error: "No id specified for Group."
                                                });
                                            }

                                            this.node.createGroup(request.body, request.nodeUuid).then(function () {
                                                this.node.publishNodeConfigurationChange(request.nodeUuid, request.headers['client-token']);
                                                this.reverseProxyNamespace.emit("httpResponse", {
                                                    uuid: request.uuid,
                                                    status: 0,
                                                    data: this.cleanConfigurationCopy(request.nodeUuid)
                                                });
                                            }.bind(this)).fail(function (error) {
                                                this.logError(error);

                                                throw error;
                                            }.bind(this));
                                        }
                                        else if ((details = this.matchRequestPath(request.path, "/nodes/:node/configuration/groups/:group")) && request.method === "PUT") {
                                            this.node.updateGroup(details.params.group, request.body, request.nodeUuid).then(function () {
                                                this.node.publishNodeConfigurationChange(request.nodeUuid, request.headers['client-token']);
                                                this.reverseProxyNamespace.emit("httpResponse", {
                                                    uuid: request.uuid,
                                                    status: 0,
                                                    data: this.cleanConfigurationCopy(request.nodeUuid)
                                                });
                                            }.bind(this)).fail(function (error) {
                                                this.logError(error);

                                                throw error;
                                            }.bind(this));
                                        }
                                        else if ((details = this.matchRequestPath(request.path, "/nodes/:node/configuration/groups/:group")) && request.method === "DELETE") {
                                            this.node.deleteGroup(details.params.group, request.nodeUuid).then(function () {
                                                this.node.publishNodeConfigurationChange(request.nodeUuid, request.headers['client-token']);
                                                this.reverseProxyNamespace.emit("httpResponse", {
                                                    uuid: request.uuid,
                                                    status: 0,
                                                    data: this.cleanConfigurationCopy(request.nodeUuid)
                                                });
                                            }.bind(this)).fail(function (error) {
                                                this.logError(error);

                                                throw error;
                                            }.bind(this));
                                        }
                                        else if ((details = this.matchRequestPath(request.path, "/nodes/:node/configuration/eventProcessors")) && request.method === "POST") {
                                            if (!request.body.id) {
                                                this.reverseProxyNamespace.emit("httpError", {
                                                    uuid: request.uuid,
                                                    status: 500,
                                                    error: "No id specified for Event Processor."
                                                });
                                            }

                                            this.node.createEventProcessor(request.body, request.nodeUuid).then(function () {
                                                this.node.publishNodeConfigurationChange(request.nodeUuid, request.headers['client-token']);
                                                this.reverseProxyNamespace.emit("httpResponse", {
                                                    uuid: request.uuid,
                                                    status: 0,
                                                    data: this.cleanConfigurationCopy(request.nodeUuid)
                                                });
                                            }.bind(this)).fail(function (error) {
                                                this.logError(error);

                                                throw error;
                                            }.bind(this));
                                        }
                                        else if ((details = this.matchRequestPath(request.path, "/nodes/:node/configuration/eventProcessors/:eventProcessor")) && request.method === "PUT") {
                                            this.node.updateEventProcessor(details.params.eventProcessor, request.body, request.nodeUuid).then(function () {
                                                this.node.publishNodeConfigurationChange(request.nodeUuid, request.headers['client-token']);
                                                this.reverseProxyNamespace.emit("httpResponse", {
                                                    uuid: request.uuid,
                                                    status: 0,
                                                    data: this.cleanConfigurationCopy(request.nodeUuid)
                                                });
                                            }.bind(this)).fail(function (error) {
                                                this.logError(error);

                                                throw error;
                                            }.bind(this));
                                        }
                                        else if ((details = this.matchRequestPath(request.path, "/nodes/:node/configuration/eventProcessors/:eventProcessor")) && request.method === "DELETE") {
                                            this.node.deleteEventProcessor(details.params.eventProcessor, request.nodeUuid).then(function () {
                                                this.node.publishNodeConfigurationChange(request.nodeUuid, request.headers['client-token']);
                                                this.reverseProxyNamespace.emit("httpResponse", {
                                                    uuid: request.uuid,
                                                    status: 0,
                                                    data: this.cleanConfigurationCopy(request.nodeUuid)
                                                });
                                            }.bind(this)).fail(function (error) {
                                                this.logError(error);

                                                throw error;
                                            }.bind(this));
                                        }
                                        else if ((details = this.matchRequestPath(request.path, "/nodes/:node/configuration/storyboards")) && request.method === "POST") {
                                            if (!request.body.id) {
                                                this.reverseProxyNamespace.emit("httpError", {
                                                    uuid: request.uuid,
                                                    status: 500,
                                                    error: "No id specified for Storyboard."
                                                });
                                            }

                                            this.node.createStoryboard(request.body, request.nodeUuid).then(function () {
                                                this.node.publishNodeConfigurationChange(request.nodeUuid, request.headers['client-token']);
                                                this.reverseProxyNamespace.emit("httpResponse", {
                                                    uuid: request.uuid,
                                                    status: 0,
                                                    data: this.cleanConfigurationCopy(request.nodeUuid)
                                                });
                                            }.bind(this)).fail(function (error) {
                                                this.logError(error);

                                                throw error;
                                            }.bind(this));
                                        }
                                        else if ((details = this.matchRequestPath(request.path, "/nodes/:node/configuration/storyboards/:storyboard")) && request.method === "PUT") {
                                            this.node.updateStoryboard(details.params.storyboard, request.body, request.nodeUuid).then(function () {
                                                this.node.publishNodeConfigurationChange(request.nodeUuid, request.headers['client-token']);
                                                this.reverseProxyNamespace.emit("httpResponse", {
                                                    uuid: request.uuid,
                                                    status: 0,
                                                    data: this.cleanConfigurationCopy(request.nodeUuid)
                                                });
                                            }.bind(this)).fail(function (error) {
                                                this.logError(error);

                                                throw error;
                                            }.bind(this));
                                        }
                                        else if ((details = this.matchRequestPath(request.path, "/nodes/:node/configuration/storyboards/:storyboard")) && request.method === "DELETE") {
                                            this.node.deleteStoryboard(details.params.storyboard, request.nodeUuid).then(function () {
                                                this.node.publishNodeConfigurationChange(request.nodeUuid, request.headers['client-token']);
                                                this.reverseProxyNamespace.emit("httpResponse", {
                                                    uuid: request.uuid,
                                                    status: 0,
                                                    data: this.cleanConfigurationCopy(request.nodeUuid)
                                                });
                                            }.bind(this)).fail(function (error) {
                                                this.logError(error);

                                                throw error;
                                            }.bind(this));
                                        }
                                        else if ((details = this.matchRequestPath(request.path, "/nodes/:node/configuration/jobs")) && request.method === "POST") {
                                            if (!request.body.id) {
                                                this.reverseProxyNamespace.emit("httpError", {
                                                    uuid: request.uuid,
                                                    status: 500,
                                                    error: "No id specified for Job."
                                                });
                                            }

                                            this.node.createJob(request.body, request.nodeUuid).then(function () {
                                                this.node.publishNodeConfigurationChange(request.nodeUuid, request.headers['client-token']);
                                                this.reverseProxyNamespace.emit("httpResponse", {
                                                    uuid: request.uuid,
                                                    status: 0,
                                                    data: this.cleanConfigurationCopy(request.nodeUuid)
                                                });
                                            }.bind(this)).fail(function (error) {
                                                this.logError(error);

                                                throw error;
                                            }.bind(this));
                                        }
                                        else if ((details = this.matchRequestPath(request.path, "/nodes/:node/configuration/jobs/:job")) && request.method === "PUT") {
                                            this.node.updateJob(details.params.job, request.body, request.nodeUuid).then(function () {
                                                this.node.publishNodeConfigurationChange(request.nodeUuid, request.headers['client-token']);
                                                this.reverseProxyNamespace.emit("httpResponse", {
                                                    uuid: request.uuid,
                                                    status: 0,
                                                    data: this.cleanConfigurationCopy(request.nodeUuid)
                                                });
                                            }.bind(this)).fail(function (error) {
                                                this.logError(error);

                                                throw error;
                                            }.bind(this));
                                        }
                                        else if ((details = this.matchRequestPath(request.path, "/nodes/:node/configuration/jobs/:job")) && request.method === "DELETE") {
                                            this.node.deleteJob(details.params.job, request.nodeUuid).then(function () {
                                                this.node.publishNodeConfigurationChange(request.nodeUuid, request.headers['client-token']);
                                                this.reverseProxyNamespace.emit("httpResponse", {
                                                    uuid: request.uuid,
                                                    status: 0,
                                                    data: this.cleanConfigurationCopy(request.nodeUuid)
                                                });
                                            }.bind(this)).fail(function (error) {
                                                this.logError(error);

                                                throw error;
                                            }.bind(this));
                                        }
                                        else if ((details = this.matchRequestPath(request.path, "/nodes/:node/files")) && request.method === "POST") {
                                            if (!fs
                                                    .existsSync(this.options.dataDirectory
                                                        + "/files")) {
                                                fs
                                                    .mkdirSync(this.options.dataDirectory
                                                        + "/files");
                                            }

                                            this
                                                .logDebug("Start writing to "
                                                    + this.options.dataDirectory
                                                    + "/files/"
                                                    + fileName);
                                            fs.createWriteStream(this.options.dataDirectory
                                                + "/files/"
                                                + fileName);
                                        }
                                        else if ((details = this.matchRequestPath(request.path, "/nodes/:node/logs")) && request.method === "DELETE") {

                                            if (docker.container()){

                                                docker.destroyLogStream();

                                                this.reverseProxyNamespace.emit("httpResponse", {
                                                    uuid: request.uuid,
                                                    status: 0,
                                                    data: docker.isLogStream()
                                                });
                                            }

                                        }
                                        else if ((details = this.matchRequestPath(request.path, "/nodes/:node/logs")) && request.method === "POST") {

                                            this.logDebug("Log configuration: " + JSON.stringify(request.body));

                                            if (docker.container()){

                                                this.logDebug("Logs are derived from TIN docker container.");

                                                var logStream = new stream.PassThrough();

                                                logStream.on('data', function(chunk){

                                                    if (this.namespace) {
                                                        this.namespace.emit("logChunk", {
                                                            data: chunk.toString('utf8'), gateway: request.nodeUuid
                                                        });
                                                    }

                                                    if (this.reverseProxyNamespace) {
                                                        this.reverseProxyNamespace.emit("logChunk", {
                                                            data: chunk.toString('utf8'), gateway: request.nodeUuid
                                                        });
                                                    }
                                                }.bind(this));

                                                docker.logs(request.body, logStream).then(function (){

                                                    this.reverseProxyNamespace.emit("httpResponse", {
                                                        uuid: request.uuid,
                                                        status: 0,
                                                        data: docker.isLogStream()
                                                    });


                                                }.bind(this));

                                            }else{
                                                // TODO read logs from log file instead
                                            }
                                        }
                                        else if ((details = this.matchRequestPath(request.path, "/nodes/:node/devices/:device/state/:state/resource")) && request.method === "GET") {
                                            var device = this.node[details.params.device];

                                            if (!device) {
                                                this.emitError(request, "Cannot find device " + details.params.device);
                                            }

                                            if (!device.getResourceUrl) {
                                                this.emitError(request, "Device is missing method 'getResourceUrl()'");
                                            }

                                            var url = device.getResourceUrl(details.params.state);

                                            this.logDebug("URL", url);

                                            if (url.indexOf("http://") == 0 || url.indexOf("https://") == 0) {
                                                try {
                                                    Request.get(device.getResourceUrl(details.params.state)).on('response', function (response) {
                                                        this.reverseProxyNamespace.emit("httpHeader", {
                                                            uuid: request.uuid,
                                                            status: response.statusCode,
                                                            'content-type': response.headers['content-type']
                                                        });
                                                    }.bind(this)).on('data', function (chunk) {
                                                        if (this.reverseProxyNamespace) {
                                                            this.reverseProxyNamespace.emit("httpChunk", {
                                                                uuid: request.uuid,
                                                                status: 0,
                                                                data: chunk
                                                            });
                                                        }
                                                    }.bind(this)).on('close', function () {
                                                        if (this.reverseProxyNamespace) {
                                                            this.reverseProxyNamespace.emit("httpEnd", {
                                                                uuid: request.uuid,
                                                                status: 200,
                                                            });
                                                        }
                                                    }.bind(this)).on('error', function (error) {
                                                        this.emitError(request, error);
                                                    }.bind(this));
                                                } catch (error) {
                                                    this.logError(error);

                                                    this.emitError(request, error);
                                                }
                                            } else {
                                                fs.createReadStream(url)
                                                    .on("data", function (chunk) {
                                                        if (this.reverseProxyNamespace) {
                                                            this.reverseProxyNamespace.emit("httpChunk", {
                                                                uuid: request.uuid,
                                                                status: 0,
                                                                data: chunk
                                                            });
                                                        }
                                                    }.bind(this)).on("end", function (error) {
                                                    if (this.reverseProxyNamespace) {
                                                        this.reverseProxyNamespace.emit("httpEnd", {
                                                            uuid: request.uuid,
                                                            status: 200,
                                                        });
                                                    }
                                                }.bind(this)).on("error", function (error) {
                                                    this.emitError(request, error);
                                                }.bind(this));
                                            }
                                        }
                                        else {
                                            this.logError("Unsupported request path " + request.path);

                                            this.emitError(request, error);
                                        }
                                    }
                                    catch
                                        (error) {
                                        try {
                                            this.logError("Return error response:", error);

                                            this.reverseProxyNamespace.emit("httpError", {
                                                uuid: request.uuid,
                                                status: 500,
                                                error: error
                                            });
                                        }
                                        catch (error) {
                                            this.logError("Cannot emit error response: " + error);
                                        }
                                    }
                                }.bind(this));
                            }.bind(this));
                        }
                        else {
                            this.logInfo("Node Box is unpaired - wait for pairing and retry.");

                            // TODO Why can't we just continue with the connectInterval here?
                            // Only advantage of current approach seems to be to have two different time intervals

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
        }.bind(this), this.PROXY_RETRY_TIME);
    };

    /**
     *
     */
    NodeManager.prototype.emitError = function (request, error) {
        try {
            this.logError("Return error response.");

            this.reverseProxyNamespace.emit("httpError", {
                uuid: request.uuid,
                status: 500,
                error: error
            });
        }
        catch (error) {
            this.logError("Cannot emit error response: " + error);
        }
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
    NodeManager.prototype.getState = function (uuid) {

        var state =  {
            state: this.state,
            lastModificationTimestamp: uuid ? this.configurationsMap[uuid].configuration.lastModificationTimestamp : null,
            firmwareVersion: require("../package").version
        };

        if (docker.container()){
            state.logStream = docker.isLogStream();
        }

        return state;
    };

    /**
     * @deprecated Should not be called anymore
     */
    NodeManager.prototype.configure = function (node) {
        if (this.state === "running") {
            this.node.stop();
        }

        this.node = node;
        this.node.lastModificationTimestamp = new Date().getTime();

        if (this.options.nodeConfigurationFile) {
            this.saveNodeConfiguration(this.options.nodeConfigurationFile, this.node);
        }

        utils.inheritMethods(this.node,
            new Node());

        this.node.initialize(this.devicePlugins, this.options);

        // TODO Needed/correct?

        this.node.namespace = this.namespace;
        this.node.reverseProxyNamespace = this.reverseProxyNamespace;

        this.state = "configured";
    };

    /**
     * Updates a specific node configuration (from REST) by stopping the Node Box, saving the new
     * Node Configuration and restarting the Node Box
     *
     * TODO Block calls during configuration
     */
    NodeManager.prototype.updateNodeConfiguration = function (uuid, nodeConfiguration) {
        nodeConfiguration.lastModificationTimestamp = new Date().getTime();

        // Save unmangled configuration

        fs.writeFileSync(this.configurationsMap[uuid].filePath, "module.exports = " + JSON.stringify(nodeConfiguration) + ";", {
            encoding: "utf-8"
        });

        this.reloadAndRestart();
    };

    /**
     *
     */
    NodeManager.prototype.reloadAndRestart = function () {
        // TODO This should be called at the end - but need to consider to keep web sockets alive during restart

        if (this.state === "running") {
            this.node.stop();
        }

        this.state = "configured";

        this.node = this.loadNodeConfigurations();
        this.node.__nodeManager = this;

        utils.inheritMethods(this.node, new Node());

        this.node.initialize(this.devicePlugins, this.options);
        this.node.start();

        this.state = "running";

        this
            .logInfo("Node started with previously updated configuration.");
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
    NodeManager.prototype.restart = function (details) {
        this.logInfo("Restarting Node.");

        var deferred = q.defer();

        if (docker.container()){

            deferred.resolve();
            docker.restart(this.options.watchdog);

        }else {

            this.node.stop().then(function () {
                this.node.start().then(function () {
                    deferred.resolve();
                }.bind(this)).fail(function (error) {
                    deferred.reject(error);
                }.bind(this));
            }.bind(this)).fail(function (error) {
                deferred.reject(error);
            }.bind(this));

        }

        return deferred.promise;
    };

    /**
     *
     */
    NodeManager.prototype.stop = function (details) {
        this.logInfo("Stopping Node in state", this.state);

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
        this.logInfo("Disconnecting Node Manager.");

        // Stop the Node

        this.node.stop();

        // Cleanup all Node Manager Intervals and Namespaces

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
    Node.prototype.initialize = function (plugins, options) {
        this.options = options;
        this.class = "Node";
        this.logLevel = options.logLevel;
        this.plugins = plugins;

        // Configuration can overwrite the options
        if (this.simulated == undefined) {
            this.simulated = options.simulated;
        }

        this.devices = this.devices ? this.devices : [];
        this.services = this.services ? this.services : [];
        this.groups = this.groups ? this.groups : [];
        this.eventProcessors = this.eventProcessors ? this.eventProcessors : [];
        this.jobs = this.jobs ? this.jobs : [];

        // TODO To NodeManager?

        this.pendingDeviceRegistrations = {};

        this.bind();

        return this;
    };

    /**
     * We copy everything we know that does not have a cyclic relationship.
     *
     * @returns {{id: *, label: *, devices: Array, services: Array, groups: Array, data: Array}}
     */
    Node.prototype.clientCopy = function () {
        var copy = this.__nodeManager.clientCopy(this);

        // TODO More elegant?
        // TODO Need to handle cross-configuration

        for (var m in this.__nodeManager.configurationsMap) {
            var token = this.__nodeManager.mangleId(m, "");

            this.logDebug("Replacing " + token);

            for (var n in copy.services) {
                if (copy.services[n].type === "script" && copy.services[n].content && copy.services[n].content.script) {

                    copy.services[n].content.script = copy.services[n].content.script.replace(new RegExp(token, "g"), "[node].");
                }
            }
        }

        return copy;
    };

    /**
     *
     */
    Node.prototype.bind = function () {
        this.logDebug("Binding Node [" + this.label + "].");

        // Namespace with unmangled IDs for service execution

        this.__executionContext = {};

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

        // Bind Event Processors

        if (this.eventProcessors) {
            for (var n in this.eventProcessors) {
                eventProcessor.bind(this, this.eventProcessors[n]);
            }
        }

        this.logInfo("Event Processors bound.");

        // Bind Jobs

        if (this.jobs) {
            for (var n in this.jobs) {
                job.bind(this, this.jobs[n]);
            }
        }

        this.logInfo("Jobs bound.");

        // Bind Data

        if (!this.data) {
            this.data = [];
        }

        for (var n in this.data) {
            data.bind(this, this.data[n]);
        }

        this.logInfo("Data bound.");

        // Bind Groups

        for (var n in this.groups) {
            group.bind(this, this.groups[n]);
        }

        this.logInfo("Groups bound.");

        return this;
    };

    /**
     *
     */
    Node.prototype.start = function () {
        var deferred = q.defer();

        this.logInfo("Starting Node [" + this.label + "].");

        // Start auto-discovery for non-simulated gateways
        if (this.isSimulated()) {

            this.logDebug("No Auto-Discovery started for simulated gateways.");

        }else{

            this.logDebug("Start Auto-Discovery");

            for (var n in this.autoDiscoveryDeviceTypes) {
                try {
                    discovery.create(this, this.autoDiscoveryDeviceTypes[n]).start();

                    this.logDebug("Start Auto-Discovery for [" + this.autoDiscoveryDeviceTypes[n].plugin + "]");
                } catch (x) {
                    this.logError("Cannot start autodiscovery for Plugin [" + this.autoDiscoveryDeviceTypes[n].plugin + "]", x);
                }
            }

            this.logInfo("Auto-Discovery started.");
        }

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
                                        + "] booted.");

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
    Node.prototype.findDeviceByUUID = function (uuid) {
        for (var n = 0; n < this.devices.length; ++n) {
            if (this.devices[n].uuid == uuid) {
                return this.devices[n];
            }
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

        throw "No Service with ID [" + id + "].";
    };

    /**
     *
     */
    Node.prototype.findGroup = function (id) {
        for (var n = 0; n < this.groups.length; ++n) {
            if (this.groups[n].id == id) {
                return this.groups[n];
            }
        }

        throw "No Group with ID [" + id + "].";
    };

    /**
     *
     */
    Node.prototype.findEventProcessor = function (id) {
        for (var n = 0; n < this.eventProcessors.length; ++n) {
            if (this.eventProcessors[n].id == id) {
                return this.eventProcessors[n];
            }
        }

        throw "No Event Processor with ID [" + id + "].";
    };

    /**
     *
     */
    Node.prototype.findData = function (id) {
        for (var n in this.data) {
            if (this.data[n].id == id) {
                return this.data[n];
            }
        }

        throw "No Data with ID [" + id + "].";
    };

    /**
     *
     */
    Node.prototype.findDataType = function (id) {
        if (id == 'string') {
            return {family: 'primitive', id: 'string', label: 'String'}
        }
        else if (id == 'number') {
            return {family: 'primitive', id: 'number', label: 'Number'}
        }
        else if (id == 'decimal') {
            return {family: 'primitive', id: 'decimal', label: 'Decimal'}
        }
        else if (id == 'scientific') {
            return {family: 'primitive', id: 'scientific', label: 'Scientific'}
        }
        else if (id == 'date') {
            return {family: 'primitive', id: 'date', label: 'Date'}
        }

        for (var n in this.dataTypes) {
            if (this.dataTypes[n].id == id) {
                return this.dataTypes[n];
            }
        }

        throw "No Data Type with ID [" + id + "].";
    };

    /**
     *
     */
    Node.prototype.findJob = function (id) {
        for (var n = 0; n < this.jobs.length; ++n) {
            if (this.jobs[n].id == id) {
                return this.jobs[n];
            }
        }

        throw "No Job with ID [" + id + "].";
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

        for (var n in this.devices) {
            this.devices[n].stopDevice();
        }

        for (var n in this.eventProcessors) {
            this.eventProcessors[n].stop();
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

    Node.prototype.publishDeviceEvent = function (device, event, data, relatedId) {
        this.logDebug("Publish Device Event", device.label, event, data);

        if (this.namespace) {
            this.namespace.emit("deviceEvent", {
                node: this.uuid,
                device: device.id,
                timestamp: moment().toISOString(),
                event: event,
                data: data,
                relatedId: relatedId
            });
        }


        if (this.reverseProxyNamespace) {
            var nodeUuid = this.__nodeManager.extractNodeUuid(device.id);
            var configuration = this.__nodeManager.configurationsMap[nodeUuid].configuration;

            this.reverseProxyNamespace.emit("deviceEvent", {
                customer: configuration.customer,
                mesh: configuration.mesh,
                node: nodeUuid,
                gatewayConfiguration: configuration.id,
                device: this.__nodeManager.unmangleId(device.id),
                timestamp: moment().toISOString(),
                event: event,
                data: data,
                relatedId: relatedId
            });
        }
    };

    /**
     *
     */
    Node.prototype.publishDeviceOperationalStateChange = function (device, state) {
        this.logDebug("Publish Device Operational State Change", device.label, state);

        if (this.namespace) {
            this.namespace.emit("deviceOperationalStateChange", {
                node: this.uuid,
                device: device.id,
                timestamp: moment().toISOString(),
                state: state
            });
        }

        if (this.reverseProxyNamespace) {
            var nodeUuid = this.__nodeManager.extractNodeUuid(device.id);
            var configuration = this.__nodeManager.configurationsMap[nodeUuid].configuration;

            this.reverseProxyNamespace.emit("deviceOperationalStateChange", {
                customer: configuration.customer,
                mesh: configuration.mesh,
                node: this.__nodeManager.extractNodeUuid(device.id),
                gatewayConfiguration: configuration.id,
                device: this.__nodeManager.unmangleId(device.id),
                timestamp: moment().toISOString(),
                state: state
            });
        }
    };

    /**
     *
     */
    Node.prototype.publishDeviceStateChange = function (device, state) {
        this.logDebug("Publish Device State Change", device.label, state);

        if (this.namespace) {
            this.namespace.emit("deviceStateChange", {
                node: this.uuid,
                device: device.id,
                timestamp: moment().toISOString(),
                state: state
            });
        }

        if (this.reverseProxyNamespace) {
            var nodeUuid = this.__nodeManager.extractNodeUuid(device.id);
            var configuration = this.__nodeManager.configurationsMap[nodeUuid].configuration;

            this.reverseProxyNamespace.emit("deviceStateChange", {
                customer: configuration.customer,
                mesh: configuration.mesh,
                node: this.__nodeManager.extractNodeUuid(device.id),
                gatewayConfiguration: configuration.id,
                device: this.__nodeManager.unmangleId(device.id),
                timestamp: moment().toISOString(),
                state: state
            });
        }
    };

    /**
     *
     */
    Node.prototype.publishDeviceStateChangeHistory = function (device, history) {
        this.logDebug("Publish Device State Change History", device.label, history);

        if (this.namespace) {
            this.namespace.emit("deviceStateChangeHistory", {
                node: this.uuid,
                device: device.id,
                history: history
            });
        }

        if (this.reverseProxyNamespace) {
            var nodeUuid = this.__nodeManager.extractNodeUuid(device.id);
            var configuration = this.__nodeManager.configurationsMap[nodeUuid].configuration;

            this.reverseProxyNamespace.emit("deviceStateChangeHistory", {
                customer: configuration.customer,
                mesh: configuration.mesh,
                node: this.__nodeManager.extractNodeUuid(device.id),
                gatewayConfiguration: configuration.id,
                device: this.__nodeManager.unmangleId(device.id),
                history: history
            });
        }
    };

    /**
     *
     */
    Node.prototype.publishActorOperationalStateChange = function (device, actor, state) {
        try {
            if (this.namespace) {
                this.namespace.emit("actorOperationalStateChange", {
                    node: this.uuid,
                    device: this.__nodeManager.unmangleId(device.id),
                    timestamp: moment().toISOString(),
                    actor: actor.id,
                    state: state
                });
            }

            if (this.reverseProxyNamespace) {
                var nodeUuid = this.__nodeManager.extractNodeUuid(device.id);
                var configuration = this.__nodeManager.configurationsMap[nodeUuid].configuration;

                this.reverseProxyNamespace.emit("actorOperationalStateChange", {
                    customer: configuration.customer,
                    mesh: configuration.mesh,
                    node: this.__nodeManager.extractNodeUuid(device.id),
                    gatewayConfiguration: configuration.id,
                    device: this.__nodeManager.unmangleId(device.id),
                    timestamp: moment().toISOString(),
                    actor: actor.id,
                    state: state
                });
            }
        }
        catch (error) {
            this.logError(error);
        }
    };

    /**
     *
     */
    Node.prototype.publishActorStateChange = function (device, actor, state) {
        try {
            if (this.namespace) {
                this.namespace.emit("actorStateChange", {
                    node: this.uuid,
                    device: device.id,
                    actor: actor.id,
                    timestamp: moment().toISOString(),
                    state: state
                });
            }

            if (this.reverseProxyNamespace) {
                var nodeUuid = this.__nodeManager.extractNodeUuid(device.id);
                var configuration = this.__nodeManager.configurationsMap[nodeUuid].configuration;

                this.reverseProxyNamespace.emit("actorStateChange", {
                    customer: configuration.customer,
                    mesh: configuration.mesh,
                    node: this.__nodeManager.extractNodeUuid(device.id),
                    gatewayConfiguration: configuration.id,
                    device: this.__nodeManager.unmangleId(device.id),
                    actor: actor.id,
                    timestamp: moment().toISOString(),
                    state: state
                });
            }
        }
        catch (error) {
            this.logError(error);
        }
    };

    /**
     *
     */
    Node.prototype.publishActorStateChangeHistory = function (device, actor, history) {
        try {
            if (this.namespace) {
                this.namespace.emit("actorStateChangeHistory", {
                    node: this.uuid,
                    device: device.id,
                    actor: actor.id,
                    history: history
                });
            }

            if (this.reverseProxyNamespace) {
                var nodeUuid = this.__nodeManager.extractNodeUuid(device.id);
                var configuration = this.__nodeManager.configurationsMap[nodeUuid].configuration;

                this.reverseProxyNamespace.emit("actorStateChangeHistory", {
                    customer: configuration.customer,
                    mesh: configuration.mesh,
                    node: this.__nodeManager.extractNodeUuid(device.id),
                    gatewayConfiguration: configuration.id,
                    device: this.__nodeManager.unmangleId(device.id),
                    actor: actor.id,
                    history: history
                });
            }
        }
        catch (error) {
            this.logError(error);
        }
    };

    /**
     *
     */
    Node.prototype.publishDataStateChange = function (data, state) {
        try {
            if (this.namespace) {
                this.namespace.emit("dataStateChange", {
                    node: this.uuid,
                    data: data.id,
                    timestamp: moment().toISOString(),
                    state: state
                });
            }

            if (this.reverseProxyNamespace) {
                var nodeUuid = this.__nodeManager.extractNodeUuid(data.id);
                var configuration = this.__nodeManager.configurationsMap[nodeUuid].configuration;

                this.reverseProxyNamespace.emit("dataStateChange", {
                    customer: configuration.customer,
                    mesh: configuration.mesh,
                    node: this.__nodeManager.extractNodeUuid(data.id),
                    gatewayConfiguration: configuration.id,
                    data: this.__nodeManager.unmangleId(data.id),
                    timestamp: moment().toISOString(),
                    state: state
                });
            }
        }
        catch (error) {
            this.logError(error);
        }
    };

    /**
     *
     */
    Node.prototype.publishFlowStart = function (service, parameters) {
        if (this.namespace) {
            this.namespace.emit("flowStart", {
                node: this.uuid,
                flow: service.content.flow,
                timestamp: moment().toISOString(),
                parameters: parameters
            });
        }

        if (this.reverseProxyNamespace) {
            var nodeUuid = this.__nodeManager.extractNodeUuid(service.id);
            var configuration = this.__nodeManager.configurationsMap[nodeUuid].configuration;

            this.reverseProxyNamespace.emit("flowStart", {
                customer: configuration.customer,
                mesh: configuration.mesh,
                node: this.__nodeManager.extractNodeUuid(service.id),
                gatewayConfiguration: configuration.id,
                flow: service.content.flow,
                timestamp: moment().toISOString(),
                parameters: parameters
            });
        }
    };

    /**
     *
     */
    Node.prototype.publishDeviceAdvertisement = function (device) {
        try {
            if (this.namespace) {
                this.namespace.emit("deviceAdvertisement", {
                    node: this.uuid,
                    uuid: device.uuid,
                    label: device.label
                });
            }

            if (this.reverseProxyNamespace) {
                var nodeUuid = this.__nodeManager.extractNodeUuid(device.id);
                var configuration = this.__nodeManager.configurationsMap[nodeUuid].configuration;

                this.reverseProxyNamespace.emit("deviceAdvertisement", {
                    mesh: configuration.mesh,
                    node: this.__nodeManager.defaultNodeConfiguration.uuid,
                    gatewayConfiguration: configuration.id,
                    uuid: device.uuid,
                    label: device.label
                });
            }

            this.logDebug("Done with emitting.");
        }
        catch (error) {
            this.logError(error);
        }
    };

    /**
     *
     */
    Node.prototype.publishDeviceRegistration = function (device) {
        try {
            if (this.namespace) {
                this.namespace.emit("deviceRegistration", {
                    node: this.uuid,
                    device: device.id
                });
            }

            if (this.reverseProxyNamespace) {
                var nodeUuid = this.__nodeManager.extractNodeUuid(device.id);
                var configuration = this.__nodeManager.configurationsMap[nodeUuid].configuration;

                this.reverseProxyNamespace.emit("deviceRegistration", {
                    mesh: configuration.mesh,
                    node: this.__nodeManager.defaultNodeConfiguration.uuid,
                    gatewayConfiguration: configuration.id,
                    device: this.__nodeManager.unmangleId(device.id)
                });
            }
        }
        catch (error) {
            this.logError(error);
        }
    };

    /**
     *
     */
    Node.prototype.publishStoryboardProgress = function (storyboard, elapsedTime) {
        this.logDebug("Publishing Storyboard progress on [" + this.__nodeManager.unmangleId(storyboard.id) + "] at " + elapsedTime);

        try {
            if (this.namespace) {
                this.namespace.emit("storyboardProgress", {
                    node: this.uuid,
                    storyboard: storyboard.id,
                    elapsedTime: elapsedTime
                });
            }

            if (this.reverseProxyNamespace) {
                var nodeUuid = this.__nodeManager.extractNodeUuid(storyboard.id);
                var configuration = this.__nodeManager.configurationsMap[nodeUuid].configuration;

                this.reverseProxyNamespace.emit("storyboardProgress", {
                    mesh: configuration.mesh,
                    node: this.__nodeManager.extractNodeUuid(storyboard.id),
                    gatewayConfiguration: configuration.id,
                    storyboard: this.__nodeManager.unmangleId(storyboard.id),
                    elapsedTime: elapsedTime
                });
            }
        }
        catch (error) {
            this.logError(error);
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
            this.logError("Failed to invoke Service [" + serviceId + "]:");
            this.logError(x);
        }
    };

    /**
     *
     */
    Node.prototype.executeScript = function (script, parameters) {
        this.__executionContext.parameters = parameters;

        with (this.__executionContext) {
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

            return script;
        }

        script.replace("\n", "");
        script.replace('\"', '"');

        return script;
    };

    /**
     *
     */
    Node.prototype.saveData = function () {
        for (var n in this.data) {
            this.data[n].save();

            this.publishDataStateChange(this.data[n], this[this.data[n].id]);
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

        for (var n in this.devices) {
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

    /**
     *
     * @param newDevice
     * @returns {*|promise}
     */
    Node.prototype.createDevice = function (newDevice, nodeConfigurationUuid) {
        var deferred = q.defer();

        if (!nodeConfigurationUuid) {
            nodeConfigurationUuid = this.__nodeManager.defaultNodeConfiguration.uuid;
        }

        newDevice.id = utils.getNextDefaultId(this.devices, this.__nodeManager.mangleId(nodeConfigurationUuid, "device"), 1);

        var clone = utils.cloneFiltered(newDevice);

        this.devices.push(clone);
        device.bind(this, clone).startDevice().then(function () {
            deferred.resolve(newDevice);
        }.bind(this)).fail(function () {
            utils.removeItemFromArray(this.devices, clone);
            deferred.reject(error);
        }.bind(this));

        return deferred.promise;
    };

    /**
     *
     * @param id
     * @param newDevice
     * @returns {*|promise}
     */
    Node.prototype.updateDevice = function (id, newDevice, nodeConfigurationUuid) {
        var deferred = q.defer();

        if (!nodeConfigurationUuid) {
            nodeConfigurationUuid = this.__nodeManager.defaultNodeConfiguration.uuid;
        }

        var oldDevice = this.findDevice(id);

        oldDevice.stopDevice().then(function () {
            this.logDebug("Stopped", newDevice);

            utils.removeItemFromArray(this.devices, oldDevice);
            this.devices.push(newDevice);
            device.bind(this, newDevice);

            newDevice.startDevice().then(function () {
                deferred.resolve();
            }.bind(this)).fail(function () {
                utils.removeItemFromArray(this.devices, newDevice);
                this.devices.push(oldDevice);
                deferred.reject(error);
            }.bind(this));
        }.bind(this)).fail(function (error) {
            deferred.reject(error);
        }.bind(this));

        return deferred.promise;
    };

    /**
     *
     * @param id
     * @param newDevice
     * @returns {*|promise}
     */
    Node.prototype.deleteDevice = function (id, nodeConfigurationUuid) {
        var deferred = q.defer();

        if (!nodeConfigurationUuid) {
            nodeConfigurationUuid = this.__nodeManager.defaultNodeConfiguration.uuid;
        }

        var oldDevice = this.findDevice(id);

        oldDevice.stopDevice().then(function () {
            utils.removeItemFromArray(this.devices, oldDevice);

            // TODO Cleanup in groups, actions, ...

            deferred.resolve();
        }.bind(this)).fail(function (error) {
            this.devices.push(oldDevice);
            deferred.reject(error);
        }.bind(this));

        return deferred.promise;
    };

    // TODO Remove Actor/Sensor CRUD - covered by Device update

    /**
     *
     * @param newActor
     * @returns {*|promise}
     */
    Node.prototype.createActor = function (deviceId, newActor, nodeConfigurationUuid) {
        var deferred = q.defer();

        if (!nodeConfigurationUuid) {
            nodeConfigurationUuid = this.__nodeManager.defaultNodeConfiguration.uuid;
        }

        var newDevice = this.findDevice(deviceId);

        newDevice.actors.push(newActor);
        actor.bind(newDevice, newActor);

        newActor.startActor().then(function () {
            deferred.resolve();
        }.bind(this)).fail(function () {
            utils.removeItemFromArray(this.newDevice.actors, newActor);
            deferred.reject(error);
        }.bind(this));

        return deferred.promise;
    };

    /**
     *
     * @param id
     * @param newActor
     * @returns {*|promise}
     */
    Node.prototype.updateActor = function (deviceId, id, newActor, nodeConfigurationUuid) {
        var deferred = q.defer();

        if (!nodeConfigurationUuid) {
            nodeConfigurationUuid = this.__nodeManager.defaultNodeConfiguration.uuid;
        }

        var newDevice = this.findDevice(deviceId);
        var oldActor = newDevice.findActor(id);

        oldActor.stopActor().then(function () {
            utils.removeItemFromArray(newDevice.actors, oldActor);
            newDevice.actors.push(newActor);
            actor.bind(this, newActor);

            newActor.startActor().then(function () {
                deferred.resolve();
            }.bind(this)).fail(function () {
                utils.removeItemFromArray(newDevice.actors, newActor);
                newDevice.actors.push(oldActor);
                deferred.reject(error);
            }.bind(this));
        }.bind(this)).fail(function (error) {
            deferred.reject(error);
        }.bind(this));

        return deferred.promise;
    };

    /**
     *
     * @param id
     * @param newActor
     * @returns {*|promise}
     */
    Node.prototype.deleteActor = function (deviceId, id, nodeConfigurationUuid) {
        var deferred = q.defer();

        if (!nodeConfigurationUuid) {
            nodeConfigurationUuid = this.__nodeManager.defaultNodeConfiguration.uuid;
        }

        var newDevice = this.findDevice(deviceId);
        var oldActor = newDevice.findActor(id);

        oldActor.stopActor().then(function () {
            utils.removeItemFromArray(newDevice.actors, oldActor);

            // TODO Cleanup in groups, actions, ...

            deferred.resolve();
        }.bind(this)).fail(function (error) {
            newDevice.actors.push(oldActor);
            deferred.reject(error);
        }.bind(this));

        return deferred.promise;
    };

    /**
     *
     * @param newSensor
     * @returns {*|promise}
     */
    Node.prototype.createSensor = function (deviceId, newSensor, nodeConfigurationUuid) {
        var deferred = q.defer();

        if (!nodeConfigurationUuid) {
            nodeConfigurationUuid = this.__nodeManager.defaultNodeConfiguration.uuid;
        }

        var newDevice = this.findDevice(deviceId);

        newDevice.sensors.push(newSensor);
        sensor.bind(newDevice, newSensor);

        newSensor.startSensor().then(function () {
            deferred.resolve();
        }.bind(this)).fail(function () {
            utils.removeItemFromArray(this.newDevice.sensors, newSensor);
            deferred.reject(error);
        }.bind(this));

        return deferred.promise;
    };

    /**
     *
     * @param id
     * @param newSensor
     * @returns {*|promise}
     */
    Node.prototype.updateSensor = function (deviceId, id, newSensor, nodeConfigurationUuid) {
        var deferred = q.defer();

        if (!nodeConfigurationUuid) {
            nodeConfigurationUuid = this.__nodeManager.defaultNodeConfiguration.uuid;
        }

        var newDevice = this.findDevice(deviceId);
        var oldSensor = newDevice.findSensor(id);

        oldSensor.stopSensor().then(function () {
            utils.removeItemFromArray(newDevice.sensors, oldSensor);
            newDevice.sensors.push(newSensor);

            sensor.bind(this, newSensor);

            newSensor.startSensor().then(function () {
                deferred.resolve();
            }.bind(this)).fail(function () {
                utils.removeItemFromArray(newDevice.sensors, newSensor);
                newDevice.sensors.push(oldSensor);
                deferred.reject(error);
            }.bind(this));
        }.bind(this)).fail(function (error) {
            deferred.reject(error);
        }.bind(this));

        return deferred.promise;
    };

    /**
     *
     * @param id
     * @param newSensor
     * @returns {*|promise}
     */
    Node.prototype.deleteSensor = function (deviceId, id, nodeConfigurationUuid) {
        var deferred = q.defer();

        if (!nodeConfigurationUuid) {
            nodeConfigurationUuid = this.__nodeManager.defaultNodeConfiguration.uuid;
        }

        var newDevice = this.findDevice(deviceId);
        var oldSensor = newDevice.findSensor(id);

        oldSensor.stopSensor().then(function () {
            utils.removeItemFromArray(newDevice.sensors, oldSensor);

            // TODO Cleanup in groups, actions, ...

            deferred.resolve();
        }.bind(this)).fail(function (error) {
            newDevice.sensors.push(oldSensor);
            deferred.reject(error);
        }.bind(this));

        return deferred.promise;
    };

    /**
     *
     * @param newService
     * @returns {*|promise}
     */
    Node.prototype.createService = function (newService, nodeConfigurationUuid) {
        var deferred = q.defer();

        if (!nodeConfigurationUuid) {
            nodeConfigurationUuid = this.__nodeManager.defaultNodeConfiguration.uuid;
        }

        newService.id = utils.getNextDefaultId(this.services, this.__nodeManager.mangleId(nodeConfigurationUuid, "service"), 1);

        var clone = _.cloneDeep(newService)

        if (clone.type === "script" && clone.content && clone.content.script) {
            // Runtime needs the mangled script

            clone.content.script = this.__nodeManager.mangleScript(nodeConfigurationUuid, clone.content.script);
        }

        this.services.push(clone);
        service.bind(this, clone);

        deferred.resolve(newService);

        return deferred.promise;
    };

    /**
     *
     * @param id
     * @param newService
     * @returns {*|promise}
     */
    Node.prototype.updateService = function (id, newService, nodeConfigurationUuid) {
        var deferred = q.defer();

        if (!nodeConfigurationUuid) {
            nodeConfigurationUuid = this.__nodeManager.defaultNodeConfiguration.uuid;
        }

        var oldService = this.findService(id);

        utils.removeItemFromArray(this.services, oldService);
        this.services.push(newService);
        service.bind(this, newService);

        if (newService.type === "script" && newService.content && newService.content.script) {
            // Runtime needs the mangled script

            newService.content.script = this.__nodeManager.mangleScript(nodeConfigurationUuid, newService.content.script);
        }

        deferred.resolve();

        return deferred.promise;
    };

    /**
     *
     * @param id
     * @returns {*|promise}
     */
    Node.prototype.deleteService = function (id, nodeConfigurationUuid) {
        var deferred = q.defer();

        if (!nodeConfigurationUuid) {
            nodeConfigurationUuid = this.__nodeManager.defaultNodeConfiguration.uuid;
        }

        var oldService = this.findService(id);

        utils.removeItemFromArray(this.services, oldService);
        deferred.resolve();

        return deferred.promise;
    };

    /**
     *
     * @param newGroup
     * @returns {*|promise}
     */
    Node.prototype.createGroup = function (newGroup, nodeConfigurationUuid) {
        var deferred = q.defer();

        if (!nodeConfigurationUuid) {
            nodeConfigurationUuid = this.__nodeManager.defaultNodeConfiguration.uuid;
        }

        newGroup.id = utils.getNextDefaultId(this.groups, this.__nodeManager.mangleId(nodeConfigurationUuid, "group"), 1);

        var clone = _.cloneDeep(newGroup);

        this.groups.push(clone);
        group.bind(this, clone);
        deferred.resolve(newGroup);

        return deferred.promise;
    };

    /**
     *
     * @param id
     * @param newGroups
     * @returns {*|promise}
     */
    Node.prototype.updateGroup = function (id, newGroup, nodeConfigurationUuid) {
        var deferred = q.defer();

        if (!nodeConfigurationUuid) {
            nodeConfigurationUuid = this.__nodeManager.defaultNodeConfiguration.uuid;
        }

        var oldGroup = this.findGroup(id);

        utils.removeItemFromArray(this.groups, oldGroup);
        this.groups.push(newGroup);
        group.bind(this, newGroup);
        deferred.resolve();

        return deferred.promise;
    };

    /**
     *
     * @param id
     * @returns {*|promise}
     */
    Node.prototype.deleteGroup = function (id, nodeConfigurationUuid) {
        var deferred = q.defer();

        if (!nodeConfigurationUuid) {
            nodeConfigurationUuid = this.__nodeManager.defaultNodeConfiguration.uuid;
        }

        var oldGroup = this.findGroup(id);

        utils.removeItemFromArray(this.groups, oldGroup);
        deferred.resolve();

        return deferred.promise;
    };

    /**
     *
     * @param newEventProcessor
     * @returns {*|promise}
     */
    Node.prototype.createEventProcessor = function (newEventProcessor, nodeConfigurationUuid) {
        var deferred = q.defer();

        if (!nodeConfigurationUuid) {
            nodeConfigurationUuid = this.__nodeManager.defaultNodeConfiguration.uuid;
        }

        newEventProcessor.id = utils.getNextDefaultId(this.eventProcessors, this.__nodeManager.mangleId(nodeConfigurationUuid, "eventProcessor"), 1);

        var clone = _.cloneDeep(newEventProcessor);

        this.eventProcessors.push(clone);
        eventProcessor.bind(this, clone).start()
        deferred.resolve(newEventProcessor);

        return deferred.promise;
    }
    ;

    /**
     *
     * @param id
     * @param newEventProcessor
     * @returns {*|promise}
     */
    Node.prototype.updateEventProcessor = function (id, newEventProcessor, nodeConfigurationUuid) {
        var deferred = q.defer();

        if (!nodeConfigurationUuid) {
            nodeConfigurationUuid = this.__nodeManager.defaultNodeConfiguration.uuid;
        }

        var oldEventProcessor = this.findEventProcessor(id);

        utils.removeItemFromArray(this.eventProcessors, oldEventProcessor);
        this.eventProcessors.push(newEventProcessor);
        eventProcessor.bind(this, newEventProcessor);
        deferred.resolve();

        return deferred.promise;
    };

    /**
     *
     * @param id
     * @returns {*|promise}
     */
    Node.prototype.deleteEventProcessor = function (id, nodeConfigurationUuid) {
        var deferred = q.defer();

        if (!nodeConfigurationUuid) {
            nodeConfigurationUuid = this.__nodeManager.defaultNodeConfiguration.uuid;
        }

        var oldEventProcessor = this.findEventProcessor(id);

        utils.removeItemFromArray(this.eventProcessors, oldEventProcessor);
        deferred.resolve();

        return deferred.promise;
    };

    /**
     *
     * @param newStoryboard
     * @returns {*|promise}
     */
    Node.prototype.createStoryboard = function (newStoryboard, nodeConfigurationUuid) {
        var deferred = q.defer();

        if (!nodeConfigurationUuid) {
            nodeConfigurationUuid = this.__nodeManager.defaultNodeConfiguration.uuid;
        }

        newStoryboard.id = utils.getNextDefaultId(this.services, this.__nodeManager.mangleId(nodeConfigurationUuid, "storyboard"), 1);

        var clone = _.cloneDeep(newStoryboard);

        this.services.push(clone);
        storyboard.bind(this, clone);
        deferred.resolve(newStoryboard);

        return deferred.promise;
    };

    /**
     *
     * @param id
     * @param newStoryboard
     * @returns {*|promise}
     */
    Node.prototype.updateStoryboard = function (id, newStoryboard, nodeConfigurationUuid) {
        var deferred = q.defer();

        if (!nodeConfigurationUuid) {
            nodeConfigurationUuid = this.__nodeManager.defaultNodeConfiguration.uuid;
        }

        var oldStoryboard = this.findService(id);

        utils.removeItemFromArray(this.services, oldStoryboard);
        this.services.push(newStoryboard);
        storyboard.bind(this, newStoryboard);
        deferred.resolve();

        return deferred.promise;
    };

    /**
     *
     * @param id
     * @returns {*|promise}
     */
    Node.prototype.deleteStoryboard = function (id, nodeConfigurationUuid) {
        var deferred = q.defer();

        if (!nodeConfigurationUuid) {
            nodeConfigurationUuid = this.__nodeManager.defaultNodeConfiguration.uuid;
        }

        var oldStoryboard = this.findService(id);

        utils.removeItemFromArray(this.services, oldStoryboard);
        deferred.resolve();

        return deferred.promise;
    };

    /**
     *
     * @param newJob
     * @returns {*|promise}
     */
    Node.prototype.createJob = function (newJob, nodeConfigurationUuid) {
        var deferred = q.defer();

        if (!nodeConfigurationUuid) {
            nodeConfigurationUuid = this.__nodeManager.defaultNodeConfiguration.uuid;
        }

        newJob.id = utils.getNextDefaultId(this.jobs, this.__nodeManager.mangleId(nodeConfigurationUuid, "job"), 1);

        var clone = _.cloneDeep(newJob);

        this.jobs.push(clone);
        job.bind(this, clone).activate();
        deferred.resolve(newJob);

        return deferred.promise;
    };

    /**
     *
     * @param idcreate
     * @param newJob
     * @returns {*|promise}
     */
    Node.prototype.updateJob = function (id, newJob, nodeConfigurationUuid) {
        var deferred = q.defer();

        if (!nodeConfigurationUuid) {
            nodeConfigurationUuid = this.__nodeManager.defaultNodeConfiguration.uuid;
        }

        var oldJob = this.findJob(id);

        oldJob.deactivate();
        utils.removeItemFromArray(this.jobs, oldJob);
        this.jobs.push(newJob);
        job.bind(this, newJob).activate();
        deferred.resolve();

        return deferred.promise;
    };

    /**
     *
     * @param id
     * @returns {*|promise}
     */
    Node.prototype.deleteJob = function (id, nodeConfigurationUuid) {
        var deferred = q.defer();

        if (!nodeConfigurationUuid) {
            nodeConfigurationUuid = this.__nodeManager.defaultNodeConfiguration.uuid;
        }

        var oldJob = this.findJob(id);

        utils.removeItemFromArray(this.jobs, oldJob);
        deferred.resolve();

        return deferred.promise;
    };

    /**
     * TODO General method name
     */
    Node.prototype.publishNodeConfigurationChange = function (nodeConfigurationUuid, initiatingClient) {
        if (!nodeConfigurationUuid) {
            nodeConfigurationUuid = this.__nodeManager.defaultNodeConfiguration.uuid;
        }

        try {
            this.__nodeManager.saveNodeConfiguration(nodeConfigurationUuid);
        }
        catch (error) {
            this.logError("Cannot save Node Configuration: ", error);
        }

        this.emitNodeConfigurationChange(nodeConfigurationUuid, initiatingClient);
    };

    /**
     *
     */
    Node.prototype.emitNodeConfigurationChange = function (nodeConfigurationUuid, initiatingClient) {
        try {
            if (this.namespace) {
                this.namespace.emit("nodeConfigurationChange", {
                    initiatingClient: initiatingClient,
                    configuration: this.__nodeManager.cleanConfigurationCopy(nodeConfigurationUuid)
                });
            }

            if (this.reverseProxyNamespace) {
                this.reverseProxyNamespace.emit("nodeConfigurationChange", {
                    initiatingClient: initiatingClient,
                    configuration: this.__nodeManager.cleanConfigurationCopy(nodeConfigurationUuid)
                });
                this.logDebug("Emitted Node Configuration Change for Node " + nodeConfigurationUuid + " by client " + initiatingClient);
            }
        }
        catch (error) {
            this.logError("Cannot publish Node Configuration Change: ", error);
        }
    };

    /**
     *
     * @param id
     * @returns {*|promise}
     */
    Node.prototype.loadDevicePluginModule = function (path) {
        var deferred = q.defer();

        npm.load(function (error) {
            if (error) {
                deferred.reject(error);
            }

            var modulePlugin = "thing-it-device-" + path.split("/")[0];

            this.logDebug("Attempt to load " + modulePlugin);

            //npm.commands.install([modulePlugin], function (error, data) {
            //    if (error) {
            //        deferred.reject(error);
            //    }
            //
            //    this.logDebug("Loaded " + modulePlugin, data);
            //
            //    deferred.resolve();
            //}.bind(this));
            //
            //npm.on("log", function (message) {
            //    this.logDebug(message);
            //}.bind(this));
        }.bind(this));

        deferred.resolve();

        return deferred.promise;
    };

    /**
     *
     */
    Node.prototype.pushAllStates = function () {
        if (this.state === "running") {
            for (var n in this.devices) {
                this.publishDeviceStateChange(this.devices[n], this.devices[n]
                    .getState());

                for (var m in this.devices[n].actors) {
                    this.publishActorStateChange(this.devices[n], this.devices[n].actors[m], this.devices[n].actors[m]
                        .getState());
                }

                // TODO Anything for sensors?
            }
        }
    }
}