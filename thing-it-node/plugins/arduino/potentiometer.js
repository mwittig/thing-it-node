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

		var self = this;

		try {
			if (!self.isSimulated()) {
				var five = require("johnny-five");

				this.potentiometer = new five.Potentiometer();

				this.potentiometer.on("change", function(data) {
					self.change(data);
				});
				this.potentiometer.on("data", function(event) {
					self.data(event);
				});
			}
		} catch (x) {
			this.publishMessage("Cannot initialize " + this.device.id + "/"
					+ this.id + ":" + x);
		}
	};
};