module.exports = {
	create : function() {
		return new RgbLed();
	}
};

var q = require('q');

/**
 * 
 */
function RgbLed() {
	/**
	 * 
	 */
	RgbLed.prototype.start = function() {
		var deferred = q.defer();
		var self = this;

		this.startActor().then(
				function() {
					self.state = {red: 0 green: 0, blue: 0};

					if (!self.isSimulated()) {
						try {
							var five = require("johnny-five");

							self.led = new five.Led.RGB([ self.configuration.pinRed, self.configuration.pinGreen, self.configuration.pinBlue ]);
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
	RgbLed.prototype.getState = function() {
		return state;
	};

	/**
	 * 
	 */
	RgbLed.prototype.on = function() {
		if (this.led) {
			this.led.on();
		}

		this.state = {red: 255, green: 255, blue: 255};

		this.publishStateChange();
	};

	/**
	 * 
	 */
	RgbLed.prototype.off = function() {
		if (this.led) {
			this.led.stop().off();
		}

		this.state = {red: 0, green: 0, blue: 0};

		this.publishStateChange();
	};

	/**
	 * 
	 */
	RgbLed.prototype.color = function(parameters) {
		if (this.led) {
			this.led.color(parameters.rgbColorHex);
		}

		this.state = {red: parameters.rgbColorHex.substring(1,2), green:  parameters.rgbColorHex.substring(3,4), blue:  parameters.rgbColorHex.substring(5,6)};

		this.publishStateChange();
	};

	/**
	 * 
	 */
	RgbLed.prototype.blink = function() {
		if (this.led) {
			this.led.blink();
		}

		this.state.blink = true;

		this.publishStateChange();
	}:
};