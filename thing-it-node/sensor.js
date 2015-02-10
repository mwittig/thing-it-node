module.exports = {
	bind : function(device, sensor) {
		console.log("Loading sensor in " + device.type.directory);
		utils.inheritMethods(sensor, new Sensor());
		utils.inheritMethods(sensor, require(
				device.type.directory + "/sensors/"
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
		if (this.isSimulated()) {
			this.initializeSimulation();
		}

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
			this.publishEvent(event);
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
			this.publishValueChangeEvent(data);
		}

		for (var n = 0; n < this.eventProcessors.length; ++n) {
			this.eventProcessors[n].push(this, data);
			this.eventProcessors[n].notify(this, "valueChange");
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
	Sensor.prototype.publishEvent = function(event) {
		this.device.node.publishEvent({
			node : this.device.node.id,
			device : this.device.id,
			sensor : this.id,
			event : event
		});
	};

	/**
	 * 
	 */
	Sensor.prototype.publishValueChangeEvent = function(data) {
		this.device.node.publishEvent({
			node : this.device.node.id,
			device : this.device.id,
			sensor : this.id,
			event : "valueChange",
			value : data
		});
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

			self.value = req.body.value;

			self.data(req.body.value);
		});
		this.device.node.app.post("/devices/" + this.device.id + "/sensors/"
				+ this.id + "/event", function(req, res) {
			res.send("");

			self.change(req.body.event);
		});
	};
}