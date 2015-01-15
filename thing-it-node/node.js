module.exports = {
	plugins : loadPlugins,
	create : function(node) {
		utils.inheritMethods(node, new Node());

		node.plugins = loadPlugins();
		node.state = "configured";

		return node;
	}
};

var utils = require("./utils");
var device = require("./device");
var eventProcessor = require("./eventProcessor");
var fs = require("fs");
var q = require('q');

/**
 * 
 */
function loadPlugins() {
	var files = fs.readdirSync(__dirname + "/plugins");
	var plugins = {};

	for (var n = 0; n < files.length; ++n) {
		console.log("Loading plugin <" + files[n] + ">.");

		try {
			plugins[files[n]] = require("./plugins/" + files[n] + "/plugin")
					.create();
		} catch (x) {
			console.log("Failed to load plugin <" + files[n] + ">:");
			console.log(x);
		}
	}

	return plugins;
}

/**
 * 
 */
function Node() {
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
								console.log("Call service "
										+ req.params.service);

								self[req.params.service](req.params.service);

								res.send("");
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
		
		script += "with (this) {" + script + "}"
		
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