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
		content : {
			type : "script",
			script : "arduino1.rgbLed1.color({rgbColorHex: '#FF0000'});"
		}
	}, {
		id : "ledGreen",
		label : "Led Green",
		content : {
			type : "script",
			script : "arduino1.rgbLed1.color({rgbColorHex: '#00FF00'});"
		}
	} ],
	eventProcessors : [],
	jobs : [ {
		id : "job1",
		label : "Job 1",
		description : "One-time job.",
		test : true,
		verbose : true,
		startTimestamp : new Date().getTime() + 10000,
		fromNextFullOf : "m",
		content : {
			type : "nodeServiceCall",
			service : "ledRed"
		}
	}, {
		id : "job2",
		label : "Job 2",
		description : "Job executed every minute.",
		test : true,
		verbose : true,
		startTimestamp : new Date().getTime() - 1000 * 60 * 5,
		fromNextFullOf : "m",
		recurrence : "m",
		factor : 1,
		end : {
			type : "endAfter",
			occurences : 10
		},
		content : {
			type : "nodeServiceCall",
			service : "ledGreen"
		}
	} ]
};
