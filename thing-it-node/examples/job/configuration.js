module.exports = {
	label : "Home",
	id : "home",
	devices : [ {
		label : "Arduino Uno 1",
		id : "arduino1",
		plugin : "arduino",
		actors : [ {
			id : "rgbLed1",
			label : "LED (RGB)",
			type : "rgbLed",
			configuration : {
				pinRed : 12,
				pinGreen : 13,
				pinBlue : 14
			}
		} ],
		sensors : []
	} ],
	services : [ {
		id : "ledRed",
		label : "Led Red",
		script : "arduino1.rgbLed1.color({rgbColorHex: '#FF0000'});"
	}, {
		id : "ledGreen",
		label : "Led Green",
		script : "arduino1.rgbLed1.color({rgbColorHex: '#00FF00'});"
	} ],
	eventProcessors : [],
	jobs : [ {
		id : "job1",
		label : "Job 1",
		description : "One-time job.",
		startTimestamp : new Date().getTime() + 10000,
		fromNextFullOf: "m",
		content : {
			type : "nodeServiceCall",
			service : "ledRed"
		}
	}, {
		id : "job2",
		label : "Job 2",
		description : "Job executed every minute.",
		startTimestamp : new Date().getTime() + 2000,
		recurrence : "m",
		factor : 1,
		endAfterOccurences : 3,
		content : {
			type : "nodeServiceCall",
			service : "ledGreen"
		}
	} ]
};
