module.exports = {
	bind : function(node, storyboard) {
		utils.inheritMethods(storyboard, new Storyboard());

		storyboard.node = node;

		try {
			node[storyboard.id] = function() {
				storyboard.start();
			};

			console.log("\tStoryboard [" + storyboard.id + "] available.");
		} catch (x) {
			console.log("\tFailed to initialize Service [" + storyboard.id
					+ "]:");
			console.log(x);
		}

		return storyboard;
	}
};

var q = require('q');

var utils = require("./utils");

/**
 * TODO - Latency corrections during execution, reconcile next timestamp
 */
function Storyboard() {

	/**
	 * 
	 */
	Storyboard.prototype.log = function(output) {
		if (this.verbose) {
			console.log(output);
		}
	};

	/**
	 * 
	 */
	Storyboard.prototype.start = function() {
		this
				.log("\n===================================================================");
		this.log("   Storyboard [" + this.label + "] (" + this.id + ")\n");
		this.log("   " + this.description);
		this
				.log("===================================================================\n");
		this.log("Starting timeline");

		this.start = new Date().getTime();
		this.step(0, 0);
	};

	/**
	 * 
	 */
	Storyboard.prototype.elapsedTime = function() {
		return new Date().getTime() - this.start;
	};
	/**
	 * 
	 */
	Storyboard.prototype.step = function(index, time) {
		var self = this;

		setTimeout(
				function() {
					self.log("t = " + self.content.timeline[index].timestamp + " ("
							+ self.elapsedTime() + ")");

					if (index < self.content.timeline.length - 1) {
						// Check for state change animation

						for ( var n in self.content.timeline[index + 1].entries) {
							var entry = self.content.timeline[index + 1].entries[n];

							if (entry.type == "actorStateChange"
									&& entry.easing != null) {

								var startActorStateChange = self
										.findMatchingActorStateChange(entry,
												index);

								self
										.startEasingSequence(
												startActorStateChange ? startActorStateChange.state
														: null,
												entry,
												self.content.timeline[index].timestamp,
												self.content.timeline[index + 1].timestamp);
							}
						}

						self.step(index + 1, self.content.timeline[index].timestamp);
						self.execute(self.content.timeline[index]);
					} else {
						self.execute(self.content.timeline[index]);

						self.log("Timeline completed");
					}
				}, self.content.timeline[index].timestamp - time);
	};

	/**
	 * 
	 */
	Storyboard.prototype.findMatchingActorStateChange = function(endEntry,
			index) {
		for ( var n in this.content.timeline[index].entries) {
			var startEntry = this.content.timeline[index].entries[n];

			if (startEntry.type == "actorStateChange"
					&& startEntry.device == endEntry.device
					&& startEntry.actor == endEntry.actor) {
				this.log("*** Matching Start Entry found");

				return startEntry;
			}
		}

		return null;
	};

	/**
	 * 
	 */
	Storyboard.prototype.execute = function(step) {
		for ( var n in step.entries) {
			if (step.entries[n].type == "nodeServiceCall") {
				this.callNodeService(step.entries[n]);
			} else if (step.entries[n].type == "actorServiceCall") {
				this.callActorService(step.entries[n]);
			} else if (step.entries[n].type == "actorStateChange") {
				this.applyActorStateChange(step.entries[n]);
			}
		}
	};

	/**
	 * 
	 */
	Storyboard.prototype.callNodeService = function(call) {
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
	Storyboard.prototype.callActorService = function(call) {
		this.log("\tCalling Actor Service [" + call.device + "][" + call.actor
				+ "]." + call.service + "(");
		this.log(call.parameters);
		this.log(")");

		if (!this.test) {
			this.node[call.device][call.actor][call.service](call.parameters);
		}
	};

	/**
	 * 
	 */
	Storyboard.prototype.applyActorStateChange = function(call) {
		// TODO Implement!
		
		this.log("\tApply Actor State Change");
	};

	/**
	 * 
	 */
	Storyboard.prototype.startEasingSequence = function(startState,
			endActorStateChange, startTimestamp, endTimestamp) {
		// Calculate start state

		if (!startState) {
			startState = {};

			for ( var field in endActorStateChange.state) {
				startState[field] = 0; // Get from Actor
			}
		}

		this.log("\tStarting easing sequence (" + startTimestamp + " to "
				+ endTimestamp + ")");
		this.log(startState);
		this.log(endActorStateChange.state);

		this.stepEasingSequence(startState, endActorStateChange,
				startTimestamp, endTimestamp, startTimestamp);
	};

	/**
	 * 
	 */
	Storyboard.prototype.stepEasingSequence = function(startState,
			endActorStateChange, startTimestamp, endTimestamp, currentTimestamp) {
		if (currentTimestamp >= endTimestamp) {
			this.log("\tEnd easing sequence");

			return;
		}

		this.log("t = " + currentTimestamp + " (" + this.elapsedTime() + ")");
		this.log("\tExecute Easing Step");

		if (this.test) {
			this.getEasingValues(startState, endActorStateChange.state,
					startTimestamp, endTimestamp, currentTimestamp,
					endActorStateChange.easing);
		} else {
			this.node[endActorStateChange.device][endActorStateChange.actor]
					.setState(this.getEasingValues(startState,
							endActorStateChange.state, startTimestamp,
							endTimestamp, currentTimestamp,
							endActorStateChange.easing));
		}

		var self = this;

		setTimeout(function() {
			self.stepEasingSequence(startState, endActorStateChange,
					startTimestamp, endTimestamp, currentTimestamp
							+ self.content.easingInterval);
		}, self.content.easingInterval);
	};

	/**
	 * 
	 */
	Storyboard.prototype.getEasingValues = function(startState, endState,
			startTimestamp, endTimestamp, currentTimestamp, easing) {
		var state = {};

		for ( var field in startState) {
			state[field] = this.getEasingValue(startState[field],
					endState[field], startTimestamp, endTimestamp,
					currentTimestamp, easing);
			this.log("\t" + field + " = " + state[field]);
		}

		return state;
	};

	/**
	 * 
	 */
	Storyboard.prototype.getEasingValue = function(startValue, endValue,
			startTimestamp, endTimestamp, currentTimestamp, easing) {

		return startValue + (endValue - startValue)
				/ (endTimestamp - startTimestamp)
				* (currentTimestamp - startTimestamp);
	};
}