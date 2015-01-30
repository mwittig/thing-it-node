module.exports = {
	create : function() {
		return new Button();
	}
};

/**
 * 
 */
function Button() {
	/**
	 * 
	 */
	Button.prototype.start = function() {
		this.startSensor();

		try {
			if (!this.isSimulated()) {
				var five = require("johnny-five");

				this.button = new five.Button(this.configuration.pin);

				var self = this;

				this.button.on("hold", function() {
					self.change("hold");
				});

				this.button.on("press", function() {
					self.change("press");
				});

				this.button.on("release", function() {
					self.change("release");
				});
			}
		} catch (x) {
			this.publishMessage("Cannot initialize " + this.device.id + "/"
					+ this.id + ":" + x);
		}
	};
};