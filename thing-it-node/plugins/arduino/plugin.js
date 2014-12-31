module.exports = {
	create : function(device) {
		return new Arduino();
	}
};

var utils = require("../../utils");
var five = require("johnny-five");
var board = new five.Board();

function Arduino() {
	this.plugin = "arduino";
	this.label = "Arduino";
	this.actorTypes = [ {
		plugin : "led",
		label : "LED",
		services : [ {
			id : "on",
			label : "On"
		}, {
			id : "off",
			label : "Off"
		}, {
			id : "blink",
			label : "Blink"
		} ],
		state : [ {
			id : "light",
			name : "Light"
		} ],
		configuration : [ {
			label : "Pin",
			id : "pin",
			type : "integer"
		} ]
	}, {
		plugin : "lcd",
		label : "LCD Display",
		services : [ {
			id : "clear",
			label : "Clear",
			parameters : []
		}, {
			id : "print",
			label : "Print",
			parameters : [ {
				label : "Text",
				id : "text",
				type : "string"
			} ]
		}, {
			id : "cursorAt",
			label : "Cursor At",
			parameters : [ {
				label : "Row",
				id : "row",
				type : "integer"
			}, {
				label : "Column",
				id : "column",
				type : "integer"
			} ]
		} ],
		state : [ {
			id : "text",
			name : "Text"
		}, {
			id : "row",
			name : "Row"
		}, {
			id : "column",
			name : "Column"
		} ],
		configuration : [ {
			label : "RS Pin",
			id : "rsPin",
			type : "integer"
		}, {
			label : "EN Pin",
			id : "enPin",
			type : "integer"
		}, {
			label : "DB4 Pin",
			id : "db4Pin",
			type : "integer"
		}, {
			label : "DB5 Pin",
			id : "db5Pin",
			type : "integer"
		}, {
			label : "DB6 Pin",
			id : "db6Pin",
			type : "integer"
		}, {
			label : "DB7 Pin",
			id : "db7Pin",
			type : "integer"
		}, {
			label : "Bit-Mode",
			id : "bitMode",
			type : "enumeration",
			values : [ {
				label : "4",
				id : "4"
			}, {
				label : "8",
				id : "8"
			} ]
		} ]
	}, {
		plugin : "servo",
		label : "Servo",
		services : [ {
			id : "sweep",
			label : "Sweep",
			parameters : []
		} ],
		state : [ {
			id : "position",
			name : "Position"
		} ],
		configuration : [ {
			label : "Pin",
			id : "pin",
			type : "integer"
		}, {
			label : "Is Inverted",
			id : "isInverted",
			type : "boolean"
		}, {
			label : "Start At",
			id : "startAt",
			type : "integer",
			defaultValue : 0
		}, {
			label : "Center",
			id : "center",
			type : "boolean"
		} ]
	}, {
		plugin : "relay",
		label : "Relay",
		services : [ {
			id : "open",
			label : "Open"
		}, {
			id : "close",
			label : "Close"
		} ],
		state : [ {
			id : "gate",
			name : "Switch"
		} ],
		configuration : [ {
			label : "Pin",
			type : "integer"
		}, {
			label : "Type",
			id : "type",
			type : "enumeration",
			values : [ {
				label : "Normally Open",
				id : "NO"
			}, {
				label : "Normally Close",
				id : "NC"
			} ]
		} ]
	} ];
	this.sensorTypes = [ {
		plugin : "potentiometer",
		label : "Potentiometer",
		configuration : [ {
			label : "Pin",
			id : "pin",
			type : "integer"
		}, {
			label : "Rate",
			id : "rate",
			type : "integer",
			defaultValue : 1000,
			unit : "ms"
		} ]
	}, {
		plugin : "photocell",
		label : "Photocell",
		configuration : [ {
			label : "Pin",
			id : "pin",
			type : "string"
		}, {
			label : "Rate",
			id : "rate",
			type : "integer",
			defaultValue : 1000,
			unit : "ms"
		} ]
	}, {
		plugin : "button",
		label : "Button",
		configuration : [ {
			label : "Pin",
			id : "pin",
			type : "integer"
		}, {
			label : "Holdtime",
			id : "holdtime",
			type : "integer",
			defaultValue : 500,
			unit : "ms"
		}, {
			label : "Send Click Events",
			id : "sendClickEvents",
			type : "boolean",
			defaultValue : true
		}, , {
			label : "Send Down Events",
			id : "sendDownEvents",
			type : "boolean",
			defaultValue : false
		}, {
			label : "Send Down Events",
			id : "sendDownEvents",
			type : "boolean",
			defaultValue : false
		}, {
			label : "Send Hold Events",
			id : "sendHoldEvents",
			type : "boolean",
			defaultValue : false
		}, {
			label : "Holdtime",
			id : "holdtime",
			type : "integer",
			defaultValue : 500,
			unit : "ms"
		} ]
	} ];

	Arduino.prototype.start = function(app, io, hub) {
		var self = this;
		var initialized = false;

		// TODO board fail, initialize for simulation -> Simulation as flag

		setTimeout(function() {
			if (!initialized) {
				initialized = true;

				self.startDevice(app, io, hub);
			}
		}, 10000);

		board.on("ready", function() {
			if (!initialized) {
				initialized = true;

				self.startDevice(app, io, hub);
			}
		});
	};
}
