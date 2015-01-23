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

		var self = this;

		try {
			if (!self.isSimulated()) {
				var five = require("johnny-five");

				this.photocell = new five.Sensor({
					pin : this.configuration.pin,
					freq : this.configuration.rate
				});

				this.photocell.on("change", function(event) {
					self.change(event);
				});
				this.photocell.on("data", function() {
					self.data(self.photocell.value);
				});
			}
		} catch (x) {
			this.publishMessage("Cannot initialize " + this.device.id + "/"
					+ this.id + ":" + x);
		}
	};
};