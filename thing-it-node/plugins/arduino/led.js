module.exports = {
	create : function() {
		return new Led();
	}
};

var q = require('q');

/**
 * 
 */
function Led() {
	/**
	 * 
	 */
	Led.prototype.start = function() {
		var deferred = q.defer();
		var self = this;

		this.startActor().then(
				function() {
					self.state = "off";

					if (!self.isSimulated()) {
						try {
							var five = require("johnny-five");

							self.led = new five.Led(self.configuration.pin);
						} catch (x) {
							self.device.node
									.publishMessage("Cannot initialize "
											+ self.device.id + "/" + self.id
											+ ":" + x);
						}
					}

					deferred.resolve();
				}).fail(function(error) {
			deferred.reject(error);
		});

		return deferred.promise;
	};

	/**
	 * 
	 */
	Led.prototype.getState = function() {
		return {
			light : this.state
		};
	};

	/**
	 * 
	 */
	Led.prototype.on = function() {
		if (this.led) {
			this.led.on();
		}

		this.state = "on";

		this.publishStateChange();
	}

	/**
	 * 
	 */
	Led.prototype.off = function() {
		if (this.led) {
			this.led.stop().off();
		}

		this.state = "off";

		this.publishStateChange();
	}

	/**
	 * 
	 */
	Led.prototype.toggle = function() {
		if (this.state == "off") {
			this.state = "on";

			if (this.led) {
				this.led.on();
			}
		} else {
			this.state = "off";

			if (this.led) {
				this.led.stop().off();
			}
		}

		this.publishStateChange();
	}

	/**
	 * 
	 */
	Led.prototype.blink = function() {
		if (this.led) {
			this.led.blink();
		}

		this.state = "blink";

		this.publishStateChange();
	}
};