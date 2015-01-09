module.exports = {
	create : function() {
		return new Servo();
	}
};

var q = require('q');
var five = require("johnny-five");

/**
 * 
 */
function Servo() {
	/**
	 * 
	 */
	Servo.prototype.start = function() {
		var deferred = q.defer();
		var self = this;

		this.startActor().then(function() {
			if (!self.isSimulated()) {
				try {
					self.servo = new five.Servo(self.configuration.pin);
				} catch (x) {
					// throw "Cannot initialize Servo."
				}
			}

			deferred.resolve();
		}).fail(function(error) {
			deferred.reject(error);
		});

		return deferred.promise();
	};

	/**
	 * 
	 */
	Servo.prototype.getState = function() {
		return {};
	};
};