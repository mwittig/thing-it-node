module.exports = {
	metadata : {
		family : "virtual-device",
		plugin : "virtualDevice",
		dataTypes : {},
		actorTypes : [],
		sensorTypes : [],
		configuration : []
	},
	create : function(device) {
		return new VirtualDevice();
	}
};

var utils = require("../../utils");
var q = require('q');

function VirtualDevice() {
	VirtualDevice.prototype.start = function() {
		var deferred = q.defer();

		this.startDevice().then(function() {
			deferred.resolve();
		}).fail(function() {
			deferred.reject();
		});

		return deferred.promise;
	};
}
