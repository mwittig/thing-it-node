module.exports = {
	metadata : {
		family : "network",
		plugin : "network",
		label : "Network Utilities",
		manufacturer : "thing-it",
		connectionTypes : [ "Internal" ],
		actorTypes : [],
		sensorTypes : [],
		configuration : []
	},
	create : function(device) {
		return new Network();
	}
};

var utils = require("../../utils");
var q = require('q');

/**
 * Requires https://nmap.org/download.html
 */
function Network() {
	/**
	 * 
	 */
	Network.prototype.start = function() {
		var deferred = q.defer();
		var self = this;

		if (this.isSimulated()) {
			self.startDevice().then(function() {
				console.log("Network started.");
				deferred.resolve();
			}).fail(function() {
				deferred.reject();
			});
		} else {
			self.startDevice().then(function() {
				console.log("Network started.");
				deferred.resolve();
			}).fail(function() {
				deferred.reject();
			});
		}

		return deferred.promise;
	};

}
