module.exports = {
	create : function() {
		return new Relay();
	}
};

var q = require('q');

/**
 * 
 */
function Relay() {
	/**
	 * 
	 */
	Relay.prototype.start = function() {
		var deferred = q.defer();
		var self = this;

		this.startActor().then(
				function() {
					if (!self.isSimulated()) {
						try {
							var five = require("johnny-five");

							self.relay = new five.Relay(self.configuration.pin,
									self.configuration.type);
						} catch (x) {
							self.device.node
									.publishMessage("Cannot initialize "
											+ self.device.id + "/" + self.id
											+ ":" + x);
						}
					}

					deferred.resolve();
				}).fail(function(error) {
			deferred.reject(error);
		});

		return deferred.promise;
	};

	/**
	 * 
	 */
	Relay.prototype.getState = function() {
		return {
			gate : this.state
		};
	};

	/**
	 * 
	 */
	Relay.prototype.open = function() {
		if (this.relay) {
			this.relay.open();
		} else {
			this.state = "open";

			this.publishStateChange();
		}
	};

	/**
	 * 
	 */
	Relay.prototype.close = function() {
		if (this.relay) {
			this.relay.close();
		} else {
			this.state = "closed";

			this.publishStateChange();
		}
	};

	/**
	 * 
	 */
	Relay.prototype.close = function() {
		if (this.state == "closed") {
			this.open();
		} else {
			this.close();
		}
	}
};
