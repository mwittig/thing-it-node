module.exports = {
	bind : function(node, job) {
		utils.inheritMethods(job, new Job());

		job.node = node;

		return job;
	}
};

var q = require('q');
var moment = require('moment');
var utils = require("./utils");

/**
 * TODO - Latency corrections during execution, reconcile next timestamp
 */
function Job() {

	/**
	 * 
	 */
	Job.prototype.log = function(output) {
		if (this.verbose) {
			console.log(output);
		}
	};

	/**
	 * 
	 */
	Job.prototype.activate = function() {
		console.log("\tJob [" + this.id + "] activated.");

		this
				.log("\n===================================================================");
		this.log("   Job [" + this.label + "] (" + this.id + ")\n");
		this.log("   " + this.description);
		this
				.log("===================================================================\n");

		this.occurences = 0;
		this.activateTimestamp = new Date().getTime();

		var startOffset = this.startTimestamp - this.activateTimestamp;

		if (startOffset < 0) {
			this.log("Job timestamp is in the past. Terminating.");
		}

		var self = this;

		setTimeout(
				function() {
					if (self.recurrence) {
						if (self.recurrence == "M" || self.recurrence == "Q"
								|| self.recurrence == "y") {
							console
									.error("Monthly, quarterly and yearly jobs are not supported yet.");

							return;
						} else {
							var repeatInterval = 0;

							if (!self.factor) {
								self.factor = 1;
							}

							if (self.recurrence == "m") {
								repeatInterval = 1000 * 60 * self.factor;
							} else if (self.recurrence == "h") {
								repeatInterval = 1000 * 60 * 60 * self.factor;
							} else if (self.recurrence == "d") {
								repeatInterval = 1000 * 60 * 60 * 24
										* self.factor;
							} else if (self.recurrence == "w") {
								repeatInterval = 1000 * 60 * 60 * 24 * 7
										* self.factor;
							}

							self.timerInterval = setInterval(
									function() {
										if (self.endAtTimestamp
												&& new Date().getTime() >= self.endAtTimestamp) {
											clearInterval(self.timerInterval);

											return;
										}

										self.occurences++;

										self.execute();

										if (self.endAfterOccurences
												&& self.occurences >= self.endAfterOccurences) {
											clearInterval(self.timerInterval);

											return;
										}
									}, repeatInterval);
						}
					} else {
						self.execute();
					}
				}, startOffset);
	};

	/**
	 * 
	 */
	Job.prototype.elapsedTime = function() {
		return new Date().getTime() - this.activateTimestamp;
	};

	/**
	 * 
	 */
	Job.prototype.execute = function() {
	};

	/**
	 * 
	 */
	Job.prototype.execute = function(step) {
		this.log("t = " + this.elapsedTime() / 1000);
		this.log("\tExecuting Job [" + this.label + "] (" + this.id + ").");

		if (this.content.type == "nodeServiceCall") {
			this.callNodeService(this.content);
		} else if (this.content.type == "actorServiceCall") {
			this.callActorService(this.content);
		} else if (this.content.type == "actorStateChange") {
			this.applyActorStateChange(this.content);
		}
	};

	/**
	 * 
	 */
	Job.prototype.callNodeService = function(call) {
		this.log("\tCalling Node Service " + call.service + "(");
		this.log(call.parameters);
		this.log(")");

		if (!this.test) {
			this.node[call.service](call.parameters);
		}
	};

	/**
	 * 
	 */
	Job.prototype.callActorService = function(call) {
		this.log("\tCalling Actor Service [" + call.device + "][" + call.actor
				+ "]." + call.service + "(");
		this.log(call.parameters);
		this.log(")");

		if (!this.test) {
			this.node[call.device][call.actor][call.service](call.parameters);
		}
	};
}