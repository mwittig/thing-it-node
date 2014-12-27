module.exports = {
	observe : function(sensors) {
		var eventProcessor = new EventProcessor();

		return eventProcessor.observe(sensors);
	}
};

/**
 * 
 */
function EventProcessor() {
	/**
	 * 
	 */
	EventProcessor.prototype.observe = function(sensors) {
		this.sensors = sensors;

		return this;
	};

	/**
	 * 
	 */
	EventProcessor.prototype.window = function(length) {
		this.length = length;

		return this;
	};

	/**
	 * 
	 */
	EventProcessor.prototype.match = function(pattern) {
		this.pattern = pattern;

		return this;
	};

	/**
	 * 
	 */
	EventProcessor.prototype.call = function(callback) {
		this.series = [];
		this.callback = callback;

		for (var n = 0; n < this.sensors.length; ++n) {
			this.sensors[n].eventProcessors.push(this);
		}
	};

	/**
	 * 
	 */
	EventProcessor.prototype.push = function(data) {
		console.log("Pushing data " + data);

		this.series.push({
			data : data,
			timestamp : new Date().getTime()
		});

		if (this.series.length >= this.length) {
			console.log("===> Callback");

			// Should be events and series for all sensors

			this.callback(this.series, this.event);
			this.series = [];
		}
	};

	/**
	 * 
	 */
	EventProcessor.prototype.notify = function(event) {
		if (true/* eval("event " + event) */) {
			console.log("===> Callback");

			this.event = event;
			this.callback(this.series, this.event);
		}
	};
}
