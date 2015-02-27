module.exports = {
	metadata : {
		plugin : "infraredRemote",
		role : "actor",
		label : "Infrared Remote",
		family : "light",
		virtual : true,
		deviceTypes : [ "microcontroller/microcontroller" ],
		configuration : [ {
			label : "Pin",
			id : "pin",
			type : {
				family : "reference",
				id : "digitalInOutPin"
			},
			defaultValue : "12"
		} ]
	},
	create : function() {
		return new InfraredRemote();
	}
};

var q = require('q');

/**
 * 
 */
function InfraredRemote() {
	/**
	 * 
	 */
	InfraredRemote.prototype.start = function() {
		var deferred = q.defer();

		this.state = {};

		var self = this;

		this.startActor().then(
				function() {
					if (!self.isSimulated()) {
						try {
							var five = require("johnny-five");

							self.InfraredRemote = new five.InfraredRemote(
									self.configuration.pin);
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
	InfraredRemote.prototype.getState = function() {
		return this.state;
	};

	/**
	 * 
	 */
	InfraredRemote.prototype.setState = function(state) {
		this.state = state;
	};

	/**
	 * 
	 */
	InfraredRemote.prototype.emitSequence = function(sequence) {
		// TODO Dummy, here is how you tell "Slotto Firmata" to emit a sequence
		console.log("Emit sequence " + sequence + " on frequency "
				+ this.frequency);
	};
};