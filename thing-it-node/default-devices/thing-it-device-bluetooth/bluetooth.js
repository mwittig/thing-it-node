module.exports = {
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
	this.plugin = "bluetooth";
	this.directory = __dirname;
	this.label = "Bluetooth Device";
	this.manufacturer = "thing-it";
	this.connectionTypes = [ "Internal" ];
	this.actorTypes = [];
	this.sensorTypes = [ {
		plugin : "genericDeviceDetector",
		label : "Generic Device Detector",
		family : "detector",
		configuration : [ {
			label : "Device Name",
			id : "deviceName",
			type : {
				id : "string"
			},
			defaultValue : ""
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
	Bluetooth.prototype.start = function() {
		var deferred = q.defer();
		var self = this;

		if (this.isSimulated()) {
			self.startDevice().then(function() {
				console.log("Bluetooth started.");
				deferred.resolve();
			}).fail(function() {
				deferred.reject();
			});
		} else {
			self.startDevice().then(function() {
				console.log("Bluetooth started.");
				deferred.resolve();
			}).fail(function() {
				deferred.reject();
			});
		}

		return deferred.promise;
	};
}
