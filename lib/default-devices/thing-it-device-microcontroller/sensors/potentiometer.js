module.exports = {
	create : function() {
		return new Potentiometer();
	}
};

/**
 * 
 */
function Potentiometer() {
	/**
	 * 
	 */
	Potentiometer.prototype.start = function(app, io) {
		this.startSensor(app, io);

		try {
			if (!this.isSimulated()) {
				var five = require("johnny-five");

				this.potentiometer = new five.Sensor({
					pin : this.configuration.pin,
					freq : this.configuration.rate
				});

				var self = this;

				this.potentiometer.on("change", function(event) {
					self.value = self.potentiometer.value;

					self.change(event);
				});
				this.potentiometer.on("data", function() {
					self.value = self.potentiometer.value;

					self.data(self.potentiometer.value);
				});
			}
		} catch (x) {
			this.publishMessage("Cannot initialize " + this.device.id + "/"
					+ this.id + ":" + x);
		}
	};
};