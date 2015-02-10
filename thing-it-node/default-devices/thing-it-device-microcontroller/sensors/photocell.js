module.exports = {
	create : function() {
		return new Photocell();
	}
};

/**
 * 
 */
function Photocell() {
	/**
	 * 
	 */
	Photocell.prototype.start = function(app, io) {
		this.startSensor(app, io);

		try {
			if (!this.isSimulated()) {
				var five = require("johnny-five");

				this.photocell = new five.Sensor({
					pin : this.configuration.pin,
					freq : this.configuration.rate
				});

				var self = this;

				this.photocell.on("change", function(event) {
					self.value = self.photocell.value;

					self.change(event);
				});
				this.photocell.on("data", function() {
					self.value = self.photocell.value;

					self.data(self.photocell.value);
				});
			}
		} catch (x) {
			this.publishMessage("Cannot initialize " + this.device.id + "/"
					+ this.id + ":" + x);
		}
	};
};