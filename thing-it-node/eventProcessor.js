module.exports = {
	create : function(node, eventProcessor) {
		utils.inheritMethods(eventProcessor, new EventProcessor());

		eventProcessor.node = node;

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
	EventProcessor.prototype.start = function() {
		var deferred = q.defer();

		this.register();

		console.log("\tEvent Processor <" + this.label + "> started.");

		deferred.resolve();

		return deferred.promise;
	};

	/**
	 * 
	 */
	EventProcessor.prototype.register = function() {
		for (var n = 0; n < this.observables.length; ++n) {
			var path = this.observables[n].split(".");

			if (!this[path[0]]) {
				this[path[0]] = {};
			}

			this[path[0]][path[1]] = {
				series : []
			};

			this.node[path[0]][path[1]].eventProcessors.push(this);
		}

		this.checkMatch = new Function("input", "return " + this.match);
	};

	/**
	 * Records Sensor data for evaluation at the end of the window
	 */
	EventProcessor.prototype.push = function(sensor, value) {
		this[sensor.device.id][sensor.id].series.push({
			value : value,
			timestamp : new Date().getTime()
		});
	};

	/**
	 * Notifies the Event Processor of an Event on a Sensor.
	 */
	EventProcessor.prototype.notify = function(sensor, event) {
		console.log("Processing event " + event + " on sensor " + sensor.id);

		event = sensor.device.id + "." + sensor.id + event;

		// TODO Evaluate event only if "event" property was set, otherwise
		// collect events

		if (true/* eval("event " + event) */) {
			this.event = event;

			this.execute();
		}
	};

	/**
	 * Notifies the Event Processor of an Event on a Sensor.
	 */
	EventProcessor.prototype.start = function() {
		if (this.window) {
			var self = this;

			setInterval(function() {
				console.log("Interval for " + self.id);

				if (self.checkMatch()) {
					console.log("Match");

					self.execute();
				}

				// Reinitialize series

				for (var n = 0; n < self.observables.length; ++n) {
					var path = self.observables[n].split(".");

					if (!self[path[0]]) {
						self[path[0]] = {};
					}

					self[path[0]][path[1]] = {
						series : []
					};
				}
			}, this.window.duration)
		}
	};

	/**
	 * 
	 */
	EventProcessor.prototype.checkMatch = function() {
	};

	/**
	 * 
	 */
	EventProcessor.prototype.minimum = function(series) {
		var minimum = 10000000000; // TODO

		for (var n = 0; n < series.length; ++n) {
			minimum = Math.min(minimum, series[n].value);
		}

		return minimum;
	}

	/**
	 * Execute the Event Processor logic.
	 */
	EventProcessor.prototype.execute = function() {
		try {
			console.log("Execute");
			this.node[this.id]();
		} catch (x) {
			console.log("Failed to invoke script for Event Processor <"
					+ this.id + ">:");
			console.log(x);
		}
	};
}
