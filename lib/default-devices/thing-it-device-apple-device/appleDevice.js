module.exports = {
	metadata : {
		plugin : "appleDevice",
		label : "Apple Device",
		family : "apple-device",
		configuration : [ {
			label : "Host",
			id : "host",
			type : {
				family : "primitive",
				id : "string"
			},
			defaultValue : "127.0.0.1"
		}, {
			label : "Port",
			id : "port",
			type : {
				family : "primitive",
				id : "integer"
			},
			defaultValue : 3689
		}, {
			label : "Pairing Code",
			id : "pairingCode",
			type : {
				family : "primitive",
				id : "string"
			}
		} ],
		actorTypes : [],
		sensorTypes : [],
		defaultActors : [ {
			type : "dacpActor",
			configuration : {}
		} ]
	},
	create : function(device) {
		return new AppleDevice();
	}
};

var utils = require("../../utils");
var q = require('q');

/**
 * 
 */
function AppleDevice() {
	/**
	 * 
	 */
	AppleDevice.prototype.start = function() {
		var deferred = q.defer();
		var self = this;

		self.startDevice().then(function() {
			deferred.resolve();
		}).fail(function() {
			deferred.reject();
		});

		return deferred.promise;
	};
}
