module.exports = {
	create : function() {
		return new Led();
	}
};

var five = require("johnny-five");

/**
 * 
 */
function Led() {
	/**
	 * 
	 */
	Led.prototype.start = function(app, io) {
		this.startActor(app, io);

		try {
			this.led = new five.Led(this.configuration.pin);
		} catch (x) {
			this.device.node.publishMessage("Cannot initialize "
					+ this.device.id + "/" + this.id + ":" + x);
			this.state = "off";
		}
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
	Led.prototype.blink = function() {
		if (this.led) {
			this.led.blink();
		}

		this.state = "blink";

		this.publishStateChange();
	}
};