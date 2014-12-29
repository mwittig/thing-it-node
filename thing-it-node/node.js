module.exports = {
	create : function(node) {
		utils.inheritMethods(node, new Node());

		node.state = "configured";

		return node;
	}
};

var utils = require("./utils");
var device = require("./device");
var eventProcessor = require("./eventProcessor");

/**
 * 
 */
function Node() {
	/**
	 * 
	 */
	Node.prototype.start = function(app, io) {
		console.log("Starting Node <" + this.label + ">.");

		// Open namespace for web socket connections

		this.namespace = io.of("/");

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

		for (var n = 0; n < this.devices.length; ++n) {
			device.create(this, this.devices[n]).start(app, io);
		}

		// Initialize node services

		var self = this;

		// Simulate deferred for device initialization

		setTimeout(
				function() {
					for (var n = 0; n < self.services.length; ++n) {
						try {
							self[self.services[n].id] = new Function(
									'input',
									self
											.preprocessScript(self.services[n].script));

							console.log("\tService <" + self.services[n].id
									+ "> available.");
						} catch (x) {
							console.log("\tFailed to initialize Service <"
									+ self.services[n].id + ">:");
							console.log(x);
						}
					}

					app.post("/services/:service", function(req, res) {
						console.log("Call service " + req.params.service);

						self[req.params.service](req.params.service);

						res.send("");
					});

					for (var n = 0; n < self.eventProcessors.length; ++n) {
						try {
							eventProcessor
									.create(self, self.eventProcessors[n])
									.start();

							self[self.eventProcessors[n].id] = new Function(
									'input',
									self
											.preprocessScript(self.eventProcessors[n].script));
							console.log("\tEvent Processor <"
									+ self.eventProcessors[n].label
									+ "> started.");
						} catch (x) {
							console
									.log("\tFailed to start Event Processor <"
											+ self.eventProcessors[n].label
											+ ">: " + x);
						}
					}

					self.heartbeat = setInterval(function() {
						self.publishHeartbeat();
					}, 10000);

					self.publishHeartbeat();

					console.log("Node <" + self.label + "> started.");
				}, 5000);

		this.state = "running";
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