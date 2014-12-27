module.exports = {
	create : function() {
		return new Servo();
	}
};

var five = require("johnny-five");

/**
 * 
 */
function Servo() {
	/**
	 * 
	 */
	Servo.prototype.start = function(app, io) {
		this.startActor(app, io);

		try {
			this.Servo = new five.Servo(13);
		} catch (x) {
			// throw "Cannot initialize Servo."
		}
	};
	
	/**
	 * 
	 */
	Servo.prototype.getState = function() {
		return {
		};
	};
};