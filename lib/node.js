module.exports = {
	plugins : loadPlugins,
	create : function(node) {
		utils.inheritMethods(node, new Node());

		node.simulated = true;
		node.namespacePrefix = "/nodes/" + node.uuid;

		node.loadPlugins();

		return node;
	},
	bootstrap : function(options, app, io, server) {
		var node = loadNodeConfiguration(options.nodeConfigurationFile);

		if (node) {
			utils.inheritMethods(node, new Node());

			node.initialize(options, app, io, server);

			node.start(app, io.listen(server))
		} else {
			node = new Node();

			node.initialize(options, app, io, server);

			console
					.log("No Node Configuration present. Configuration push required.");
		}
	}
};

var utils = require("./utils");
var device = require("./device");
var storyboard = require("./storyboard");
var job = require("./job");
var eventProcessor = require("./eventProcessor");
var data = require("./data");
var fs = require("fs");
var q = require('q');
var crypto = require('crypto');

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
				encoding : "utf-8"
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
		encoding : "utf-8"
	});
}

/**
 * 
 */
function loadPlugins() {
	var devicePlugins = {};
	var unitPlugins = {};

	scanDevicePluginDirectories(devicePlugins, unitPlugins, __dirname
			+ "/default-devices");

	// TODO Scan modules

	// Collect units

	scanUnitPluginDirectories(devicePlugins, unitPlugins, __dirname
			+ "/default-units");

	// TODO Scan modules

	// Resolve Unit Inheritance

	for ( var n in unitPlugins) {
		var subUnit = unitPlugins[n];

		if (subUnit.superUnit) {
			inheritFromSuperUnit(subUnit, unitPlugins[subUnit.superUnit]);
		}
	}

	// Resolve Device Inheritance

	for ( var n in devicePlugins) {
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
function scanDevicePluginDirectories(devicePlugins, unitPlugins, directory) {
	var list = fs.readdirSync(directory);

	for ( var n in list) {
		var dirStat = fs.statSync(directory + "/" + list[n]);

		if (dirStat && dirStat.isDirectory()
				&& list[n].indexOf("thing-it-device-") == 0) {
			var devicePrefix = list[n].substring("thing-it-device-".length);
			var pluginFiles = fs.readdirSync(directory + "/" + list[n]);

			for ( var m in pluginFiles) {
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

						devicePlugin.path = devicePath;
						devicePlugin.modulePath = pluginModulePath;

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
					+ list[n] + "/default-units", devicePrefix);
		}
	}
}

/**
 * 
 * @param unitPlugins
 * @param directory
 */
function scanUnitPluginDirectories(devicePlugins, unitPlugins, directory) {
	var list = fs.readdirSync(directory);

	for ( var n in list) {
		var dirStat = fs.statSync(directory + "/" + list[n]);

		if (dirStat && dirStat.isDirectory()
				&& list[n].indexOf("thing-it-unit-") == 0) {
			var unitPrefix = list[n].substring("thing-it-unit-".length);

			loadUnitPlugins(devicePlugins, unitPlugins, directory + "/"
					+ list[n], unitPrefix)
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
function loadUnitPlugins(devicePlugins, unitPlugins, directory, unitPrefix) {
	if (!fs.existsSync(directory)) {
		return;
	}

	var pluginFiles = fs.readdirSync(directory);

	for ( var m in pluginFiles) {
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
				unitPlugins[unitPath] = unitPlugin;

				// Add Unit to Device Types

				for ( var l in unitPlugin.deviceTypes) {
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
	for ( var n in array) {
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
	for ( var n in superUnit.configuration) {
		if (!containsElementWithFieldValue(subUnit.configuration, "id",
				superUnit.configuration[n].id)) {
			subUnit.configuration.push(superUnit.configuration[n]);
		}
	}

	for ( var n in superUnit.state) {
		if (!containsElementWithFieldValue(subUnit.state, "id",
				superUnit.state[n].id)) {
			subUnit.state.push(superUnit.state[n]);
		}
	}

	if (subUnit.role == "actor") {
		for ( var n in superUnit.services) {
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

	for ( var n in superDevice.dataTypes) {
		if (!subDevice.dataTypes[n]) {
			subDevice.dataTypes[n] = superDevice.dataTypes[n];
		}
	}

	// Inherit Actor Types

	for ( var n in superDevice.actorTypes) {
		if (!containsElementWithFieldValue(subDevice.actorTypes, "plugin",
				superDevice.actorTypes[n].plugin)) {
			subDevice.actorTypes.push(superDevice.actorTypes[n]);
		}
	}

	// Inherit Sensor Types

	for ( var n in superDevice.sensorTypes) {
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

	/**
	 * 
	 */
	Node.prototype.initialize = function(options, app, io, server) {
		this.options = options;
		this.namespacePrefix = "";

		// TODO Map all relevant options

		this.simulated = options.simulated;

		this.initializeSecurityConfiguration();
		this.loadPlugins();

		// Initialize REST API for server

		var self = this;

		app.post("/login", function(req, res) {
			res.send(req.body);
		});
		app.post("/logout", function(req, res) {
			res.send(req.body);
		});
		app.get("/plugins", function(req, res) {
			self.verifyCallSignature(req, res, function() {
				res.send(self.plugins);
			});
		});
		app.get("/state", function(req, res) {
			self.verifyCallSignature(req, res, function() {
				res.send({
					state : self.state,
					configuration : self.configuration
				});
			});
		});
		app.get("/configuration", function(req, res) {
			self.verifyCallSignature(req, res, function() {
				// Send the plain configuration
				res.send(self.configuration);
			});
		});
		app
				.post(
						"/configure",
						function(req, res) {
							self
									.verifyCallSignature(
											req,
											res,
											node,
											function() {
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
		app.post("/start", function(req, res) {
			self.verifyCallSignature(req, res, node, function() {
				if (self.state == "configured") {
					self.start(app, io.listen(server)).then(function() {
						res.send("");
					}).fail(function(error) {
						res.status(500).send(error);
					});
				} else {
					res.status(500).send("Node is not configured.");
				}
			});
		});
		app.post("/stop", function(req, res) {
			self.verifyCallSignature(req, res, node, function() {
				self.stop();
				res.send("");
			});
		});
	};

	/**
	 * 
	 */
	Node.prototype.loadPlugins = function() {
		this.plugins = loadPlugins();
	};

	/**
	 * 
	 */
	Node.prototype.initializeSecurityConfiguration = function() {
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
	Node.prototype.verifyCallSignature = function(request, response, callback) {
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
	Node.prototype.start = function(app, io) {
		var deferred = q.defer();

		// Initialize communication

		this.app = app;
		this.io = io;

		// Initialization

		console.log("Starting Node [" + this.label + "].");

		// Open namespace for web socket connections

		this.namespace = this.io.of(this.namespacePrefix + "/events");

		var self = this;

		this.namespace.on("connection",
				function(socket) {
					console.log("Websocket connection established for Node "
							+ self.id);
				});
		this.namespace.on("disconnect", function(socket) {
			console
					.log("Websocket connection disconnected for Node "
							+ self.id);
		});

		// TODO Bind before namespace initialization?

		// Bind Devices

		for (var n = 0; n < this.devices.length; ++n) {
			device.bind(this, this.devices[n]);
		}

		// Bind Services

		for ( var n in this.services) {
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
			for ( var n in this.jobs) {
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
						function() {
							// Start Devices

							utils
									.promiseSequence(self.devices, 0, "start")
									.then(
											function() {
												try {
													// Event Processors

													for (var n = 0; n < self.eventProcessors.length; ++n) {
														eventProcessor
																.create(
																		self,
																		self.eventProcessors[n])
																.start();
													}

													self.app
															.post(
																	"/services/:service",
																	function(
																			req,
																			res) {
																		self
																				.verifyCallSignature(
																						req,
																						res,
																						function() {
																							self[req.params.service]
																									(req.body.parameters);

																							res
																									.send("");
																						});
																	});

													// Activate Jobs

													if (self.jobs) {
														for ( var n in self.jobs) {
															self.jobs[n]
																	.activate();
														}
													}

													self.app
															.get(
																	"/data/:data",
																	function(
																			req,
																			res) {
																		self
																				.verifyCallSignature(
																						req,
																						res,
																						function() {
																							res
																									.send(self[req.params.data]);
																						});
																	});

													self.heartbeat = setInterval(
															function() {
																self
																		.publishHeartbeat();
															}, 10000);

													self.publishHeartbeat();

													self.state = "running";

													console.log("Node ["
															+ self.label
															+ "] started.");

													deferred.resolve();
												} catch (x) {
													console.error(x);

													deferred.reject(x);
												}

											});
						});

		return deferred.promise;
	};

	/**
	 * 
	 */
	Node.prototype.isSimulated = function() {
		return this.simulated;
	};

	/**
	 * 
	 */
	Node.prototype.findDevice = function(id) {
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
	Node.prototype.stop = function() {
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
	Node.prototype.publishMessage = function(message) {
		this.namespace.emit('message', message);
	};

	/**
	 * 
	 */
	Node.prototype.publishEvent = function(event) {
		this.namespace.emit('event', event);
	};

	/**
	 * 
	 */
	Node.prototype.publishHeartbeat = function(details) {
		this.namespace.emit('heartbeat', details);
	};

	/**
	 * 
	 */
	Node.prototype.publishActorStateChange = function(device, actor, state) {
		this.namespace.emit('actorStateChange', {
			device : device.id,
			actor : actor.id,
			state : state
		});
	};

	/**
	 * 
	 */
	Node.prototype.callService = function(serviceId) {
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
	Node.prototype.findService = function(id) {
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
	Node.prototype.executeScript = function(script) {
		script = this.preprocessScript(script);

		with (this) {
			eval(script);
		}

		this.saveData();
	};

	/**
	 * 
	 */
	Node.prototype.preprocessScript = function(script) {
		// Do nothing for now

		return script;
	};

	/**
	 * 
	 */
	Node.prototype.saveData = function() {
		for (var n = 0; n < this.data.length; ++n) {
			this.data[n].save();
		}
	};
}