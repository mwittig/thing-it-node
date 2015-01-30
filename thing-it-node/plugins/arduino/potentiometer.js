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
			if (!self.isSimulated()) {
				var five = require("johnny-five");

				this.potentiometer = new five.Potentiometer();

				var self = this;

				this.potentiometer.on("change", function(data) {
					self.value = self.potentiometer.value;

					self.change(self.potentiometer.value);
				});
				this.potentiometer.on("data", function(data) {
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