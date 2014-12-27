module.exports = {
	create : function() {
		return new Relay();
	}
};

var five = require("johnny-five");

/**
 * 
 */
function Relay() {
	/**
	 * 
	 */
	Relay.prototype.start = function(app, io) {
		this.startActor(app, io);

		try {
			this.relay = new five.Relay(this.configuration.pin,
					this.configuration.type);
		} catch (x) {
			this.device.node.publishMessage("Cannot initialize "
					+ this.device.id + "/" + this.id + ":" + x);
		}
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
	Relay.prototype.publishStateChange = function() {
		this.device.node.publishActorStateChange(this.device, this, {
			state : this.state
		});
	};
};