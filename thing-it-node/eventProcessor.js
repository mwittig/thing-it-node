module.exports = {
	create : function(node, eventProcessor) {
		utils.inheritMethods(eventProcessor, new EventProcessor());

		eventProcessor.node = node;

		eventProcessor.register();

		return eventProcessor;
	}
};

var utils = require("./utils");

/**
 * 
 */
function EventProcessor() {
	/**
	 * 
	 */
	EventProcessor.prototype.register = function(callback) {
		this.series = [];
		this.callback = callback;

		for (var n = 0; n < this.observables.length; ++n) {
			var path = this.observables[n].split(".");

			this.node[path[0]][path[1]].eventProcessors.push(this);
		}
	};

	/**
	 * Records Sensor data for evaluation at the end of the window
	 */
	EventProcessor.prototype.push = function(sensor, data) {
		console.log("Pushing data " + data);

		this.series.push({
			data : data,
			timestamp : new Date().getTime()
		});
	};

	/**
	 * Notifies the Event Processor of an Event on a Sensor.
	 */
	EventProcessor.prototype.notify = function(sensor, event) {
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
				console.log("Evaluating interval");
				console.log(self.series);

				// if (this.series.length >= this.length) {
				// console.log("===> Callback");
				//
				// // Should be events and series for all sensors
				//
				// this.callback(this.series, this.event);
				// }

				self.series = [];
			}, this.window.duration)
		}
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
