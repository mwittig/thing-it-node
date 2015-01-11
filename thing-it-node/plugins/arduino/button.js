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
		this.initializeSimulation();

		var self = this;

		if (!this.isSimulated()) {
			try {
				var five = require("johnny-five");

				this.button = new five.Button(this.configuration.pin);

				this.button.on("hold", function() {
					self.change("hold");
				});

				this.button.on("press", function() {
					self.change("press");
				});

				this.button.on("release", function() {
					self.change("release");
				});
			} catch (x) {
				this.publishMessage("Cannot initialize " + this.device.id + "/"
						+ this.id + ":" + x);
			}
		}
	};
};