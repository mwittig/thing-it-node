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
				pinRed : 11,
				pinGreen : 12,
				pinBlue : 13
			}
		} ],
		sensors : [ {
			id : "button1",
			label : "Button 1",
			"type" : "button",
			"configuration" : {
				"pin" : 2
			}
		} ]
	} ],
	services : [ {
		id : "ledRed",
		label : "LED Red",
		content : {
			type : "script",
			script : "arduino1.rgbLed1.color({rgbColorHex: '#FF0000'});"
		}
	}, {
		id : "storyboard1",
		label : "Storyboard 1",
		description : "Simple service call and state change Storyboard.",
		content : {
			type : "storyboard",
			easingInterval : 200,
			timeline : [ {
				timestamp : 0,
				entries : [ {
					type : "nodeServiceCall",
					service : "ledRed"
				} ]
			}, {
				timestamp : 2000,
				entries : [ {
					type : "actorServiceCall",
					device : "arduino1",
					actor : "rgbLed1",
					service : "off",
					parameters : {}
				} ]
			}, {
				timestamp : 5000,
				entries : [ {
					type : "actorStateChange",
					device : "arduino1",
					actor : "rgbLed1",
					state : {
						red : 255,
						green : 0,
						blue : 255
					},
					easing : "linear"
				} ]

			}, {
				timestamp : 8000,
				entries : [ {
					type : "actorStateChange",
					device : "arduino1",
					actor : "rgbLed1",
					state : {
						red : 0,
						green : 255,
						blue : 255
					},
					easing : "linear"
				} ]
			}, {
				timestamp : 11000,
				entries : [ {
					type : "actorStateChange",
					device : "arduino1",
					actor : "rgbLed1",
					state : {
						red : 0,
						green : 0,
						blue : 0
					},
					easing : "linear"
				} ]
			}, {
				timestamp : 14000,
				entries : [ {
					type : "actorStateChange",
					device : "arduino1",
					actor : "rgbLed1",
					state : {
						red : 255,
						green : 255,
						blue : 0
					},
					easing : "linear"
				} ]
			}, {
				timestamp : 17000,
				entries : [ {
					type : "actorStateChange",
					device : "arduino1",
					actor : "rgbLed1",
					state : {
						red : 0,
						green : 0,
						blue : 0
					},
					easing : "linear"
				} ]
			} ]
		}
	} ],
	eventProcessors : [ {
		id : "eventProcessor1",
		label : "Event Processor 1",
		observables : [ "arduino1.button1" ],
		match : "arduino1.button1.event == 'hold'",
		content : {
			type : "nodeService",
			service : "storyboard1"
		}
	} ],
	data : []
};
