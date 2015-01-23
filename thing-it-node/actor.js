module.exports = {
	create : function(device, actor) {
		utils.inheritMethods(actor, new Actor());
		utils.inheritMethods(actor, require(
				"./plugins/" + device.type.plugin + "/"
						+ device.findActorType(actor.type).plugin).create());

		actor.device = device;
		device[actor.id] = actor;

		return actor;
	}
};

var q = require('q');
var utils = require("./utils");

/**
 * 
 */
function Actor() {
	/**
	 * 
	 */
	Actor.prototype.startActor = function() {
		var deferred = q.defer();
		var self = this;

		try {
			self.device.node.app.post("/devices/" + self.device.id + "/actors/"
					+ self.id + "/services/:service", function(req, res) {
				self.device.node.verifyCallSignature(req, res, function() {
					try {
						self[req.params.service](req.body);

						res.send(self.getState());
					} catch (x) {
						console.log("Failed to invoke service ["
								+ req.params.service + "]: " + x);
						res.status(500).send(
								"Failed to invoke service ["
										+ req.params.service + "]: " + x);
					}
				});
			});

			console.log("\t\tActor [" + self.label + "] started.");

			deferred.resolve();
		} catch (error) {
			deferred.reject("Failed to start Actor [" + self.label
					+ "] started: " + error);
		}

		return deferred.promise;
	};

	/**
	 * 
	 */
	Actor.prototype.stop = function() {
		console.log("\t\tStopping Actor " + this.label);
	};

	/**
	 * 
	 */
	Actor.prototype.publishStateChange = function() {
		this.device.node.publishActorStateChange(this.device, this, this
				.getState());
	}

	/**
	 * 
	 */
	Actor.prototype.isSimulated = function() {
		return this.device.isSimulated();
	};
}