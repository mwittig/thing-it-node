module.exports = {
	create : function(node, eventProcessor) {
		utils.inheritMethods(eventProcessor, new EventProcessor());

		eventProcessor.node = node;

		// The execution callback
		// Do more elegantly with with as a member of EventProcessor

		node[eventProcessor.id] = new Function('input', node
				.preprocessScript(eventProcessor.script));

		return eventProcessor;
	}
};

var utils = require("./utils");
var q = require('q');

/**
 * 
 */
function EventProcessor() {
	/**
	 * 
	 */
	EventProcessor.prototype.register = function() {
		// this.matchFunction = new Function("scope",
		// "with (scope){ console.log(\"" + this.match + "\"); "
		// + "console.log(" + this.match + "); return "
		// + this.match + ";}");
		this.matchFunction = new Function("scope", "with (scope){ return "
				+ this.match + ";}");
		this.scope = new Scope();

		for (var n = 0; n < this.observables.length; ++n) {
			var path = this.observables[n].split(".");

			if (!this.scope[path[0]]) {
				this.scope[path[0]] = {};
			}

			this.scope[path[0]][path[1]] = {
				event : null,
				series : []
			};

			this.node[path[0]][path[1]].eventProcessors.push(this);
		}
	};

	/**
	 * Records Sensor data for evaluation at the end of the window
	 */
	EventProcessor.prototype.push = function(sensor, value) {
		// console.log("Add data " + value + " for " + sensor.id);

		this.scope[sensor.device.id][sensor.id].series.push({
			value : value,
			timestamp : new Date().getTime()
		});
	};

	/**
	 * Notifies the Event Processor of an Event on a Sensor.
	 */
	EventProcessor.prototype.notify = function(sensor, event) {
		// console.log("Processing event " + event + " on sensor " + sensor.id);

		for (var n = 0; n < this.observables.length; ++n) {
			var path = this.observables[n].split(".");

			this.scope[path[0]][path[1]].event = null;
		}

		this.scope[sensor.device.id][sensor.id].event = event;

		// TODO Evaluate event only if "event" property was set, otherwise
		// collect events

		try {
			if (this.matchFunction(this.scope)) {
				this.execute();
			}
		} catch (x) {
			// Null pointer exception or the like
		}
	};

	/**
	 * Start listening.
	 */
	EventProcessor.prototype.start = function() {
		this.register();

		if (this.window) {
			var self = this;

			setInterval(function() {
				// console.log("Interval for " + self.id);
				//
				// for (var n = 0; n < self.observables.length; ++n) {
				// var path = self.observables[n].split(".");
				//
				// console.log(self.scope[path[0]][path[1]]);
				// }

				try {
					if (self.matchFunction(self.scope)) {
						self.execute();
					}
				} catch (x) {
					// Null pointer exception or the like
				}

				// Reinitialize series

				for (var n = 0; n < self.observables.length; ++n) {
					var path = self.observables[n].split(".");

					self.scope[path[0]][path[1]] = {
						series : []
					};
				}
			}, this.window.duration)
		}

		console.log("\tEvent Processor [" + this.label + "] listening.");
	};

	/**
	 * Execute the Event Processor logic.
	 */
	EventProcessor.prototype.execute = function() {
		try {
			this.node[this.id]();
		} catch (x) {
			console.log("Failed to invoke script for Event Processor <"
					+ this.id + ">:");
			console.log(x);
		}
	};
}

/**
 * 
 */
function Scope() {
	/**
	 * 
	 */
	Scope.prototype.minimum = function(data) {
		var minimum = 10000000000; // TODO

		for (var n = 0; n < data.length; ++n) {
			minimum = Math.min(minimum, data[n].value);
		}

		return minimum;
	};

	/**
	 * 
	 */
	Scope.prototype.maximum = function(data) {
		var maximum = -10000000000; // TODO

		for (var n = 0; n < data.length; ++n) {
			maximum = Math.max(maximum, data[n].value);
		}

		return maximum;
	};

	/**
	 * 
	 */
	Scope.prototype.average = function(data) {
		var sum = 0;

		for (var n = 0; n < data.length; ++n) {
			sum += data[n].value;
		}

		// console.log("average() = " + sum / data.length);

		return sum / data.length;
	};

	/**
	 * 
	 */
	Scope.prototype.deviation = function(data) {
		var average = this.average(data);

		var sum = 10000000000; // TODO

		for (var n = 0; n < data.length; ++n) {
			sum = (data[n].value - average) * (data[n].value - average);
		}

		// console.log("deviation() = " + Math.sqrt(sum));

		return Math.sqrt(sum);
	};
}
