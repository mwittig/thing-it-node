module.exports = {
	create : function(device, sensor) {
		utils.inheritMethods(sensor, new Sensor());
		utils.inheritMethods(sensor, require(
				"./plugins/" + device.type.plugin + "/"
						+ device.findSensorType(sensor.type).plugin).create());

		sensor.device = device;
		sensor.eventProcessors = [];
		device[sensor.id] = sensor;

		return sensor;
	}
};

var utils = require("./utils");

/**
 * 
 */
function Sensor() {
	/**
	 * 
	 */
	Sensor.prototype.startSensor = function() {
		this.initializeSimulation();

		console.log("\t\tSensor [" + this.label + "] started.");
	};

	/**
	 * 
	 */
	Sensor.prototype.stopSensor = function() {
		console.log("\t\tSensor [" + this.name + "] stopped.");
	};

	/**
	 * 
	 */
	Sensor.prototype.change = function(event) {
		// TODO Publish change only if specified so

		if (true) {
			this.publishData(event);
		}

		for (var n = 0; n < this.eventProcessors.length; ++n) {
			this.eventProcessors[n].notify(this, event);
		}
	};

	/**
	 * 
	 */
	Sensor.prototype.data = function(data) {
		// Publish data only if specified so

		if (true) {
			this.publishData(data);
		}

		for (var n = 0; n < this.eventProcessors.length; ++n) {
			this.eventProcessors[n].push(this, data);
		}
	};

	/**
	 * 
	 */
	Sensor.prototype.stop = function() {
	};

	/**
	 * 
	 */
	Sensor.prototype.publishData = function(data) {
		this.device.node.publishEvent(this.device.node.id + "-"
				+ this.device.id + "-" + this.id + ":" + data);
	};

	/**
	 * 
	 */
	Sensor.prototype.publishMessage = function(message) {
		this.device.node.publishMessage(message);
	};

	/**
	 * 
	 */
	Sensor.prototype.isSimulated = function() {
		return this.device.isSimulated();
	};

	/**
	 * 
	 */
	Sensor.prototype.initializeSimulation = function() {
		var self = this;

		this.device.node.app.post("/devices/" + this.device.id + "/sensors/"
				+ this.id + "/data", function(req, res) {
			res.send("");
			console.log("Push data on " + self.id);
			console.log(req.body);

			self.data(req.body.value);
		});
		this.device.node.app.post("/devices/" + this.device.id + "/sensors/"
				+ this.id + "/event", function(req, res) {
			res.send("");
			console.log("Push event on " + self.id);
			console.log(req.body);

			self.change(req.body.event);
		});
	};
}