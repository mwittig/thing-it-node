module.exports = {
	create : function(node, device) {
		utils.inheritMethods(device, new Device());
		utils.inheritMethods(device, require(
				"./plugins/" + device.type.plugin + "/plugin").create());

		device.node = node;
		node[device.id] = device;

		return device;
	}
};

var utils = require("./utils");
var sensor = require("./sensor");
var actor = require("./actor");

function Device() {
	/**
	 * 
	 */
	Device.prototype.startDevice = function(app, io) {
		console.log("\tStarting Device <" + this.label + ">");

		this.startActors(app, io);
		this.startSensors(app, io);

		console.log("\tDevice <" + this.label + "> started.");
	};

	/**
	 * 
	 */
	Device.prototype.startActors = function(app, io) {
		if (this.actors) {
			for (var n = 0; n < this.actors.length; ++n) {
				actor.create(this, this.actors[n]).start(app, io);
			}
		}
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
	Device.prototype.startSensors = function(app, io) {
		if (this.actors) {
			for (var n = 0; n < this.sensors.length; ++n) {
				sensor.create(this, this.sensors[n]).start(app, io);
			}
		}
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
		console.log("\tStopping Device <" + this.label + ">.");

		for (var n = 0; n < this.actors.length; ++n) {
			this.actors[n].stop();
		}

		for (var n = 0; n < this.sensors.length; ++n) {
			this.sensors[n].stop();
		}

		for (var n = 0; n < this.services.length; ++n) {
			// this.services[n];
		}

		console.log("\tDevice <" + this.label + "> stopped.");
	};
}