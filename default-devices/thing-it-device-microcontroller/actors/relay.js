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

		this.state = {
			gate : "closed"
		};
		
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
		return this.state;
	};

	/**
	 * 
	 */
	Relay.prototype.setState = function(state) {
		this.state = state;

		if (this.relay) {
			if (this.state.gate == "open") {
				this.relay.open();
			} else {
				this.relay.close();
			}
		}
	};

	/**
	 * 
	 */
	Relay.prototype.open = function() {
		if (this.relay) {
			this.relay.open();
		}

		this.state.gate = "open";

		this.publishStateChange();
	};

	/**
	 * 
	 */
	Relay.prototype.close = function() {
		if (this.relay) {
			this.relay.close();
		}

		this.state.gate = "closed";

		this.publishStateChange();
	};

	/**
	 * 
	 */
	Relay.prototype.toggle = function() {
		if (this.state == "closed") {
			this.open();
		} else {
			this.close();
		}
	}
};
