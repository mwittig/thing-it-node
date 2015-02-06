module.exports = {
	create : function(node, storyboard) {
		utils.inheritMethods(storyboard, new Storyboard());

		storyboard.node = node;
		node[storyboard.id] = storyboard;

		return storyboard;
	},
	test : function() {
		var storyboard = new Storyboard();

		storyboard.start();
	}
};

var q = require('q');

var utils = require("./utils");

/**
 * 
 */
function Storyboard() {
	this.easingInterval = 500;
	this.timeline = [ {
		timestamp : 0,
		entries : [ {
			type : "nodeServiceCall",
			service : "toggleLamps"
		} ]
	}, {
		timestamp : 2000,
		entries : [ {
			type : "nodeServiceCall",
			service : "toggleLamps"
		}, {
			type : "actorServiceCall",
			device : "arduino1",
			actor : "lcd1",
			service : "print",
			parameters : {
				text : "Hello"
			}
		} ]
	}, {
		timestamp : 5000,
		entries : [ {
			type : "nodeServiceCall",
			service : "toggleLamps"
		}, {
			type : "actorStateChange",
			device : "arduino1",
			actor : "rgbLed1",
			state : {
				red : 128,
				green : 10,
				blue : 200
			},
			easing : "linear"
		} ]
	}, {
		timestamp : 8000,
		entries : [ {
			type : "actorStateChange",
			device : "arduino1",
			actor : "rgbLed1",
			state : {
				red : 0,
				green : 0,
				blue : 0
			},
			easing : "linear"
		} ]
	} ];

	/**
	 * 
	 */
	Storyboard.prototype.start = function() {
		console.log("Starting timeline");

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
					console.log("t = " + self.timeline[index].timestamp + " ("
							+ self.elapsedTime() + ")");

					if (index < self.timeline.length - 1) {
						// Check for state change animation

						for ( var n in self.timeline[index + 1].entries) {
							var entry = self.timeline[index + 1].entries[n];

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
												self.timeline[index].timestamp,
												self.timeline[index + 1].timestamp);
							}
						}

						self.step(index + 1, self.timeline[index].timestamp);
						self.execute(self.timeline[index]);
					} else {
						self.execute(self.timeline[index]);

						console.log("Timeline completed");
					}
				}, self.timeline[index].timestamp - time);
	};

	/**
	 * 
	 */
	Storyboard.prototype.findMatchingActorStateChange = function(endEntry,
			index) {
		for ( var n in this.timeline[index].entries) {
			var startEntry = this.timeline[index].entries[n];

			if (startEntry.type == "actorStateChange"
					&& startEntry.device == endEntry.device
					&& startEntry.actor == endEntry.actor) {
				console.log("*** Matching Start Entry found");

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
		console.log("\tCalling Node Service");
	};

	/**
	 * 
	 */
	Storyboard.prototype.callActorService = function(call) {
		console.log("\tCalling Actor Service");
	};

	/**
	 * 
	 */
	Storyboard.prototype.applyActorStateChange = function(call) {
		console.log("\tApply Actor State Change");
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

		console.log("\tStarting easing sequence (" + startTimestamp + " to "
				+ endTimestamp + ")");
		console.log(startState);
		console.log(endActorStateChange.state);

		this.stepEasingSequence(startState, endActorStateChange,
				startTimestamp, endTimestamp, startTimestamp);
	};

	/**
	 * 
	 */
	Storyboard.prototype.stepEasingSequence = function(startState,
			endActorStateChange, startTimestamp, endTimestamp, currentTimestamp) {
		if (currentTimestamp >= endTimestamp) {
			console.log("\tEnd easing sequence");

			return;
		}

		var self = this;

		setTimeout(function() {
			console.log("t = " + currentTimestamp + " (" + self.elapsedTime()
					+ ")");
			console.log("\tExecute Easing Step");

			self.getEasingValues(startState, endActorStateChange.state,
					startTimestamp, endTimestamp, currentTimestamp,
					endActorStateChange.easing);

			self.stepEasingSequence(startState, endActorStateChange,
					startTimestamp, endTimestamp, currentTimestamp
							+ self.easingInterval);
		}, self.easingInterval);
	};

	/**
	 * 
	 */
	Storyboard.prototype.getEasingValues = function(startState, endState,
			startTimestamp, endTimestamp, currentTimestamp, easing) {
		for ( var field in startState) {
			console.log("\t"
					+ field
					+ " = "
					+ this.getEasingValue(startState[field], endState[field],
							startTimestamp, endTimestamp, currentTimestamp,
							easing));
		}
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