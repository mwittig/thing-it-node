module.exports = {
	create : function(node, device) {
		device.type = node.plugins[device.plugin];

		utils.inheritMethods(device, new Device());
		utils.inheritMethods(device, device.type);

		device.node = node;
		node[device.id] = device;

		return device;
	}
};

var q = require('q');
var utils = require("./utils");
var sensor = require("./sensor");
var actor = require("./actor");

function Device() {
	/**
	 * 
	 */
	Device.prototype.startDevice = function(app, io) {
		var deferred = q.defer();
		var self = this;

		console.log("\tStarting Device [" + this.label + "]");

		if (!this.actors) {
			this.actors = [];
		}

		if (!this.sensors) {
			this.sensors = [];
		}

		for (var n = 0; n < this.actors.length; ++n) {
			actor.create(this, this.actors[n]);
		}

		for (var n = 0; n < this.sensors.length; ++n) {
			sensor.create(this, this.sensors[n]);
		}

		utils.promiseSequence(this.actors, 0, "start").then(function() {
			for (var n = 0; n < self.sensors.length; ++n) {
				self.sensors[n].start();
			}

			console.log("\tDevice [" + self.label + "] started.");

			deferred.resolve();
		}).fail(function(error) {
			deferred.reject(error);
		});

		return deferred.promise;
	};

	/**
	 * 
	 */
	Device.prototype.findActorType = function(plugin) {
		for (var n = 0; n < this.type.actorTypes.length; ++n) {
			if (this.type.actorTypes[n].plugin === plugin) {
				return this.type.actorTypes[n];
			}
		}

		throw "Cannot find Actor Type <" + plugin + ">.";
	};

	/**
	 * 
	 */
	Device.prototype.startSensors = function() {
	};

	/**
	 * 
	 */
	Device.prototype.findSensorType = function(plugin) {
		for (var n = 0; n < this.type.sensorTypes.length; ++n) {
			if (this.type.sensorTypes[n].plugin === plugin) {
				return this.type.sensorTypes[n];
			}
		}

		throw "Cannot find Sensor Type <" + plugin + ">.";
	};

	/**
	 * 
	 */
	Device.prototype.findActor = function(id) {
		for (var n = 0; n < this.actors.length; ++n) {
			if (this.actors[n].id == id) {
				console.log(this.actors[n]);
				return this.actors[n];
			}
		}

		throw "No actor exists with ID " + id + ".";
	};

	/**
	 * 
	 */
	Device.prototype.stop = function() {
		console.log("\tStopping Controller <" + this.label + ">.");

		for (var n = 0; n < this.actors.length; ++n) {
			this.actors[n].stop();
		}

		for (var n = 0; n < this.sensors.length; ++n) {
			this.sensors[n].stop();
		}

		for (var n = 0; n < this.services.length; ++n) {
			// this.services[n];
		}

		console.log("\tController <" + this.label + "> stopped.");
	};

	/**
	 * 
	 */
	Device.prototype.isSimulated = function() {
		return this.node.isSimulated();
	};

}