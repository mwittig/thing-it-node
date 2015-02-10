module.exports = {
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
	this.plugin = "network";
	this.label = "Network Utilities";
	this.manufacturer = "thing-it";
	this.connectionTypes = [ "Internal" ];
	this.actorTypes = [];
	this.sensorTypes = [ {
		plugin : "hostDetector",
		label : "Host Detector",
		family : "detector",
		configuration : [ {
			label : "Host Name",
			id : "hostName",
			type : {
				id : "string"
			},
			defaultValue : ""
		}, {
			label : "IP Range",
			id : "ipRange",
			type : {
				id : "string"
			},
			defaultValue : "192.168.0.1-20"
		}, {
			label : "Port Range",
			id : "portRange",
			type : {
				id : "string"
			},
			defaultValue : "62078"
		}, {
			label : "Interval",
			id : "interval",
			type : {
				id : "integer"
			},
			defaultValue : 10000,
			unit : "ms"
		} ]
	} ];

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
