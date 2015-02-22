module.exports = {
	label : "Home",
	id : "home",
	devices : [ {
		label : "Arduino Uno 1",
		id : "arduino1",
		plugin : "arduino",
		actors : [ {
			id : "lcd1",
			label : "LCD1",
			type : "lcd",
			configuration : {
				rsPin : 8,
				enPin : 9,
				db4Pin : 4,
				db5Pin : 5,
				db6Pin : 6,
				db7Pin : 7,
				backlit : 20,
				rows : 2,
				columns : 16
			}
		} ],
		sensors : [ {
			id : "potentiometer1",
			label : "Potentiometer 1",
			type : "potentiometer",
			configuration : {
				pin : "A0",
				rate : 200
			}
		} ]
	} ],
	groups : [],
	services : [],
	eventProcessors : [ {
		id : "eventProcessor1",
		label : "Event Processor 1",
		observables : [ "arduino1.potentiometer1" ],
		match : "arduino1.potentiometer1.event.type == 'valueChange'",
		content : {
			type : "script",
			script : "arduino1.lcd1.clear(); arduino1.lcd1.print({text: eventProcessor1.arduino1.potentiometer1.event.data});"
		}
	} ],
	data : []
};
