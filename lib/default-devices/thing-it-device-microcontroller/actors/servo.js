module.exports = {
	create : function() {
		return new Servo();
	}
};

var q = require('q');

/**
 * 
 */
function Servo() {
	/**
	 * 
	 */
	Servo.prototype.start = function() {
		var deferred = q.defer();

		this.state = {
			position : this.configuration.startAt
		};

		var self = this;

		this.startActor().then(
				function() {
					if (!self.isSimulated()) {
						var five = require("johnny-five");

						try {
							self.servo = new five.Servo({
								pin : 10,
								range : [ self.configuration.minimum,
										self.configuration.maximum ],
								startAt : self.configuration.startAt
							});
						} catch (error) {
							console.error("Cannot initialize Servo: " + error);

							deferred.reject("Cannot initialize real Servo: "
									+ error);
						}
					}

					self.publishStateChange();

					deferred.resolve();
				}).fail(function(error) {
			console.error("Cannot initialize Servo: " + error);

			deferred.reject(error);
		});

		return deferred.promise;
	};

	/**
	 * 
	 */
	Servo.prototype.getState = function() {
		return this.state;
	};

	/**
	 * 
	 */
	Servo.prototype.setState = function(state) {
		this.state = state;

		if (this.servo) {
			this.servo.to(state.position);
		}
	};

	/**
	 * 
	 */
	Servo.prototype.toPosition = function(parameters) {
		this.state.position = parameters.position;

		if (this.servo) {
			this.servo.to(parameters.position);
		}

		this.publishStateChange();
	};

	/**
	 * 
	 */
	Servo.prototype.minimum = function() {
		this.state.position = this.configuration.minimum;

		if (this.servo) {
			this.servo.min();
		}

		this.publishStateChange();
	};

	/**
	 * 
	 */
	Servo.prototype.maximum = function() {
		this.state.position = this.configuration.maximum;

		if (this.servo) {
			this.servo.max();
		}

		this.publishStateChange();
	};
}