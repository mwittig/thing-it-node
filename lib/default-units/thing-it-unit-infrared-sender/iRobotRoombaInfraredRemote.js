module.exports = {
	metadata : {
		plugin : "iRobotRoombaInfraredRemote",
		role : "actor",
		label : "iRobot Roomba Infrared Remote",
		family : "light",
		baseUnit : "infrared-sender/infraredRemote",
		deviceTypes : [ "microcontroller/microcontroller" ],
		services : [ {
			id : "start",
			label : "Start"
		}, {
			id : "stop",
			label : "Stop"
		}, {
			id : "dock",
			label : "Dock"
		} ]
	},
	create : function() {
		var unit = new IRobotRoombaInfraredRemote();

		utils.inheritMethods(unit, infraredRemote.create());

		return unit;
	}
};

var utils = require("../../utils");
var infraredRemote = require("./infraredRemote");
var q = require('q');

/**
 * 
 */
function IRobotRoombaInfraredRemote() {
	this.frequency = 37000;
	
	/**
	 * 
	 */
	IRobotRoombaInfraredRemote.prototype.start = function() {
		this.emitSequence([ 70, 38, 4526, 4526, 579, 1684, 579, 1684, 579,
				1684, 579, 553, 579, 553, 579, 553, 579, 553, 579, 553, 579,
				1684, 579, 1684, 579, 1684, 579, 553, 579, 553, 579, 553, 579,
				553, 579, 553, 579, 1684, 579, 553, 579, 553, 579, 1684, 579,
				1684, 579, 553, 579, 553, 579, 1684, 579, 553, 579, 1684, 579,
				1684, 579, 553, 579, 553, 579, 1684, 579, 1684, 579, 553, 579,
				47895 ]);
	};
};