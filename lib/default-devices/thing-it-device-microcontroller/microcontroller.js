module.exports = {
	metadata : {
		family : "microcontroller",
		plugin : "microcontroller",
		directory : __dirname,
		dataTypes : {
			digitalInOutPin : {
				family : "enumeration",
				values : []
			},
			analogInPin : {
				family : "enumeration",
				values : []
			}
		},
		actorTypes : [],
		sensorTypes : []
	},
	create : function(device) {
		return new MicroController();
	}
};

var utils = require("../../utils");
var q = require('q');

function MicroController() {
}
