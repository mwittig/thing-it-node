module.exports = {
	metadata : {
		family : "bluetooth",
		plugin : "bluetooth",
		label : "Bluetooth Device",
		manufacturer : "thing-it",
		connectionTypes : [ "Internal" ],
		actorTypes : [],
		sensorTypes : [],
		configuration : []
	},
	create : function(device) {
		return new Bluetooth();
	}
};

var utils = require("../../utils");
var q = require('q');

/**
 * Requires https://nmap.org/download.html
 */
function Bluetooth() {
	/**
	 * 
	 */
	Bluetooth.prototype.start = function() {
		var deferred = q.defer();
		var self = this;

		if (this.isSimulated()) {
			self.startDevice().then(function() {
				console.log("Bluetooth Device started.");
				deferred.resolve();
			}).fail(function() {
				deferred.reject();
			});
		} else {
			self.startDevice().then(function() {
				console.log("Bluetooth Device started.");
				deferred.resolve();
			}).fail(function() {
				deferred.reject();
			});
		}

		return deferred.promise;
	};
}
