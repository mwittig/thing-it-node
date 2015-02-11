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
	var plugins = {};
	var list = fs.readdirSync(__dirname + "/default-devices");

	for ( var n in list) {
		var dirStat = fs.statSync(__dirname + "/default-devices/" + list[n]);

		if (dirStat && dirStat.isDirectory()
				&& list[n].indexOf("thing-it-device-") == 0) {
			var pluginFiles = fs.readdirSync(__dirname + "/default-devices/" + list[n]);

			for ( var m in pluginFiles) {
				var fileStat = fs.statSync(__dirname + "/default-devices/" + list[n] + "/"
						+ pluginFiles[m]);

				if (fileStat && fileStat.isFile() && pluginFiles[m]) {
					var pluginId = pluginFiles[m].substring(0, pluginFiles[m]
							.indexOf(".js"));

					console.log("Loading plugin [" + pluginId + "].");

					try {
						plugins[pluginId] = require(
								__dirname + "/default-devices/" + list[n] + "/" + pluginId)
								.create();
					} catch (x) {
						console
								.log("Failed to load plugin [" + pluginId
										+ "]:");
						console.log(x);
					}
				}
			}
		}
	}

	return plugins;
};

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

		console.log("Devices ===>");
		
		for (var n = 0; n < this.devices.length; ++n) {
			device.bind(this, this.devices[n]);
		}

		// Bind Services

		for ( var n in this.services) {
			if (this.services[n].type == "storyboard") {
				storyboard.bind(this, this.services[n]);
			} else {

				// TODO Move to object/bind

				try {
					this[this.services[n].id] = new Function('input', this
							.preprocessScript(this.services[n].script));

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

		// Start Devices

		utils.promiseSequence(this.devices, 0, "start").then(
				function() {
					try {
						// Event Processors

						for (var n = 0; n < self.eventProcessors.length; ++n) {
							eventProcessor
									.create(self, self.eventProcessors[n])
									.start();
						}

						self.app.post("/services/:service", function(req, res) {
							self.verifyCallSignature(req, res, function() {
								self[req.params.service](req.params.service);

								res.send("");
							});
						});

						// Activate Jobs

						if (self.jobs) {
							for ( var n in self.jobs) {
								self.jobs[n].activate();
							}
						}

						self.heartbeat = setInterval(function() {
							self.publishHeartbeat();
						}, 10000);

						self.publishHeartbeat();

						self.state = "running";

						console.log("Node [" + self.label + "] started.");

						deferred.resolve();
					} catch (x) {
						console.log(x);

						deferred.reject(x);
					}

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
		var processedScript = this
				.preprocessScript(this.findService(serviceId).script);

		console.log(processedScript);

		try {
			with (this) {
				eval(processedScript);
			}
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
	Node.prototype.preprocessScript = function(script) {
		// Wrap to avoid this

		script = "with (this) {" + script + "}";

		// Built-in functions

		script = script.replace(new RegExp("delay", "g"), "this.delay");

		return script;
	};

	/**
	 * For demo purposes only.
	 */
	Node.prototype.delay = function(time) {
		console.log("Delaying by " + time);

		var stop = new Date().getTime();

		while (new Date().getTime() < stop + time) {
		}
	};
}