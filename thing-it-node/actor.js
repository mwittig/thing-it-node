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

var utils = require("./utils");

/**
 * 
 */
function Actor() {
	/**
	 * 
	 */
	Actor.prototype.startActor = function(app, io) {
		this.local = {};

		var self = this;

		app.post("/devices/" + this.device.id + "/actors/" + this.id
				+ "/services/:service", function(req, res) {
			console.log("Call service on " + self.id);
			console.log(req.params);
			console.log(req.body);

			try {
				self[req.params.service](req.body);

				res.send(self.getState());
			} catch (x) {
				console.log("Failed to invoke service <" + req.params.service
						+ ">: " + x);
				res.send("Failed to invoke service <" + req.params.service
						+ ">: " + x);
			}
		});

		console.log("\t\tActor <" + this.label + "> started.");
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
		this.device.node.publishActorStateChange(this.device, this, {
			state : this.state
		});
	}
}