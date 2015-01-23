module.exports = {
	bootstrap : function(configuration, app, io, server) {
		var node = loadNodeConfiguration(configuration.nodeConfigurationFile);

		if (node) {
			utils.inheritMethods(node, new Node());

			node.initialize(configuration, app, io, server);
			node.start(app, io.listen(server))
		} else {
			node = new Node();

			node.initialize(configuration, app, io, server);

			console
					.log("No Node Configuration present. Configuration push required.");
		}
	}
};

var utils = require("./utils");
var device = require("./device");
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
		var node = JSON.parse(fs.readFileSync(nodeConfigurationFile, {
			encoding : "utf-8"
		}));

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
	console.log("Persist node configuration");

	fs.writeFileSync(nodeConfigurationFile, JSON.stringify(node), {
		encoding : "utf-8"
	});
}

/**
 * 
 */
function Node() {
	this.state = "pending";

	/**
	 * 
	 */
	Node.prototype.initialize = function(configuration, app, io, server) {
		this.__configuration = configuration;

		// TODO Get rid of this

		this.__simulated = configuration.simulated;

		this.initializeSecurityConfiguration();
		this.loadPlugins();

		// Initialize REST API for server

		var self = this;

		app.get("/plugins", function(req, res) {
			security.verifyCallSignature(req, res, self, function() {
				res.send(self.plugins);
			});
		});
		app.get("/state", function(req, res) {
			security.verifyCallSignature(req, res, self, function() {
				res.send({
					state : self.state,
					configuration : self
				});
			});
		});
		app.get("/configuration", function(req, res) {
			self.verifyCallSignature(req, res, function() {
				res.send(self);
			});
		});
		app.post("/configure", function(req, res) {
			self.verifyCallSignature(req, res, node, function() {
				if (self.state == "running") {
					self.stop();
				}

				saveNodeConfiguration(req.body);

				node = loadNodeConfiguration();

				// TODO Is the recursive closure an issue for thousands of
				// configure calls, possibly load into node?

				utils.inheritMethods(node, new Node());
				node.initialize(configuration, app, io, server);
				node.start(app, io.listen(server))

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
		var files = fs.readdirSync(__dirname + "/plugins");

		this.plugins = {};

		for (var n = 0; n < files.length; ++n) {
			console.log("Loading plugin <" + files[n] + ">.");

			try {
				this.plugins[files[n]] = require(
						"./plugins/" + files[n] + "/plugin").create();
			} catch (x) {
				console.log("Failed to load plugin <" + files[n] + ">:");
				console.log(x);
			}
		}
	};

	/**
	 * 
	 */
	Node.prototype.initializeSecurityConfiguration = function() {
		if (this.__configuration.verifyCallSignature) {
			if (!this.__configuration.publicKeyFile) {
				throw "No Public Key File defined. Please define in option [publicKeyFile] or set option [verifyCallSignature] to [false].";
			}

			try {
				this.__publicKey = fs
						.readFileSync(this.__configuration.publicKeyFile);
			} catch (x) {
				throw "Cannot read Public Key File"
						+ configuration.publicKeyFile + ": " + x;
			}

			if (!this.__configuration.signingAlgorithm) {
				throw "No Signing Algorithm defined. Set [verifyCallSignature] to [false].";
			}
		}
	};

	Node.prototype.verifyCallSignature = function(request, response, node,
			callback) {
		if (this.__configuration.verifyCallSignature) {
			var verify = crypto
					.createVerify(this.__configuration.signingAlgorithm);
			var data = request.body == null ? "" : JSON.stringify(request.body);

			verify.update(request.url + request.method + data);

			if (!request.header.Signature
					|| !verify.verify(this.__publicKey,
							request.header.Signature, 'hex')) {
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

		var self = this;

		// Initialization

		console.log("Starting Node <" + self.label + ">.");

		// Open namespace for web socket connections

		self.namespace = self.io.of("/nodes/" + self.uuid + "/events");

		self.namespace.on("connection", function(socket) {
			console.log("Websocket connection established for Node " + self.id
					+ " (" + self.uuid + ")");
		});
		self.namespace.on("disconnect", function(socket) {
			console.log("Websocket connection disconnected for Node " + self.id
					+ " (" + self.uuid + ")");
		});

		// Bind Devices

		for (var n = 0; n < this.devices.length; ++n) {
			device.create(this, this.devices[n]);
		}

		// Start Devices

		utils
				.promiseSequence(this.devices, 0, "start")
				.then(
						function() {
							// Event Processors

							for (var n = 0; n < self.eventProcessors.length; ++n) {
								eventProcessor.create(self,
										self.eventProcessors[n]).start();
							}

							for (var n = 0; n < self.services.length; ++n) {
								try {
									self[self.services[n].id] = new Function(
											'input',
											self
													.preprocessScript(self.services[n].script));

									console.log("\tService <"
											+ self.services[n].id
											+ "> available.");
								} catch (x) {
									console
											.log("\tFailed to initialize Service <"
													+ self.services[n].id
													+ ">:");
									console.log(x);
								}
							}

							self.app.post("/services/:service", function(req,
									res) {
								security.verifyCallSignature(req, res, self,
										function() {

											console.log("Call service "
													+ req.params.service);

											self[req.params.service]
													(req.params.service);

											res.send("");
										});
							});

							self.heartbeat = setInterval(function() {
								self.publishHeartbeat();
							}, 10000);

							self.publishHeartbeat();

							self.state = "running";

							console.log("Node <" + self.label + "> started.");

							deferred.resolve();
						});

		return deferred.promise;
	};

	/**
	 * 
	 */
	Node.prototype.isSimulated = function() {
		return this.__simulated;
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
		console.log("Stopping Node <" + this.label + ">.");

		for (var n = 0; n < this.devices.length; ++n) {
			this.devices[n].stop();
		}

		if (this.heartbeat) {
			clearInterval(this.heartbeat);
		}

		// TODO Still needed?

		this.polling = null;

		console.log("Stopped Node <" + this.label + ">.");

		this.state = "configured";
	};

	/**
	 * 
	 */
	Node.prototype.publishMessage = function(message) {
		this.namespace.emit('message', message);

		console.log("Published message " + message);
	};

	/**
	 * 
	 */
	Node.prototype.publishEvent = function(event) {
		this.namespace.emit('event', event);

		console.log("Published event " + event);
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
		console.log("Publis state change");
		console.log(state);

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
			console.log("Failed to invoke Service <" + serviceId + ">:");
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
	 * For demo purposes.
	 */
	Node.prototype.delay = function(time) {
		console.log("Delaying by " + time);

		var stop = new Date().getTime();

		while (new Date().getTime() < stop + time) {
		}
	};
}