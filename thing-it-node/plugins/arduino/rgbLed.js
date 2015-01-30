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
					self.state = {
						red : 0,
						green : 0,
						blue : 0,
						hex : "#000000"
					};

					if (!self.isSimulated()) {
						try {
							var five = require("johnny-five");

							self.led = new five.Led.RGB([
									self.configuration.pinRed,
									self.configuration.pinGreen,
									self.configuration.pinBlue ]);
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
		return this.state;
	};

	/**
	 * 
	 */
	RgbLed.prototype.on = function() {
		if (this.led) {
			this.led.on();
		}

		this.state = {
			red : 255,
			green : 255,
			blue : 255,
			hex : "#FFFFFF"

		};

		this.publishStateChange();
	};

	/**
	 * 
	 */
	RgbLed.prototype.off = function() {
		if (this.led) {
			this.led.stop().off();
		}

		this.state = {
			red : 0,
			green : 0,
			blue : 0,
			hex : "#000000"
		};

		this.publishStateChange();
	};

	/**
	 * 
	 */
	RgbLed.prototype.color = function(parameters) {
		if (this.led) {
			this.led.color(parameters.rgbColorHex);
		}

		var rgb = hexToRgb(parameters.rgbColorHex);

		this.state = {
			red : rgb.r,
			green : rgb.g,
			blue : rgb.b,
			hex : parameters.rgbColorHex
		};

		this.publishStateChange();
	};

	/**
	 * 
	 */
	RgbLed.prototype.setRedValue = function(parameters) {
		if (this.led) {
			this.led.color(rgbToHex(Math.min(parameters.value, 255),
					this.state.green, this.state.blue));
		}

		this.state = {
			red : Math.min(parameters.value, 255),
			green : this.state.green,
			blue : this.state.blue,
			hex : rgbToHex(Math.min(parameters.value, 255), this.state.green, this.state.blue)
		};

		this.publishStateChange();
	};

	/**
	 * 
	 */
	RgbLed.prototype.setGreenValue = function(parameters) {
		if (this.led) {
			this.led.color(rgbToHex(this.state.red, Math.min(parameters.value,
					255), this.state.blue));
		}

		this.state = {
			red : this.state.red,
			green : Math.min(parameters.value, 255),
			blue : this.state.blue,
			hex : rgbToHex(this.state.red, Math.min(parameters.value, 255), this.state.blue)
		};

		this.publishStateChange();
	};

	/**
	 * 
	 */
	RgbLed.prototype.setBlueValue = function(parameters) {
		if (this.led) {
			this.led.color(rgbToHex(this.state.red, this.state.green, Math.min(
					parameters.value, 255)));
		}

		this.state = {
			red : this.state.red,
			green : this.state.green,
			blue : Math.min(parameters.value, 255),
			hex : rgbToHex(this.state.red, this.state.green, Math.min(parameters.value, 255))
		};

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
	};
};

/**
 * 
 * @param hex
 * @returns
 */
function hexToRgb(hex) {
	// Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")

	var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;

	hex = hex.replace(shorthandRegex, function(m, r, g, b) {
		return r + r + g + g + b + b;
	});

	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

	return result ? {
		r : parseInt(result[1], 16),
		g : parseInt(result[2], 16),
		b : parseInt(result[3], 16)
	} : null;
}

/**
 * 
 * @param r
 * @param g
 * @param b
 * @returns {String}
 */
function rgbToHex(r, g, b) {
	return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
