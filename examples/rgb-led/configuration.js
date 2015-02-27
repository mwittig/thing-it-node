module.exports = {
	label : "Home",
	id : "home",
	devices : [ {
		label : "Arduino Uno 1",
		id : "arduino1",
		plugin : "microcontroller/arduino",
		actors : [ {
			id : "rgbLed1",
			label : "LED (RGB)",
			type : "rgbLed",
			configuration : {
				"pinRed" : 3,
				"pinGreen" : 5,
				"pinBlue" : 6
			}
		} ],
		sensors : [ {
			id : "potentiometerRed",
			label : "Red Value",
			type : "potentiometer",
			configuration : {
				pin : "A0",
				rate : 100,
				min : 0,
				max : 255
			}
		}, {
			id : "potentiometerGreen",
			label : "Green Value",
			type : "potentiometer",
			configuration : {
				pin : "A1",
				rate : 100,
				min : 0,
				max : 255
			}
		}, {
			id : "potentiometerBlue",
			label : "Blue Value",
			type : "potentiometer",
			configuration : {
				pin : "A2",
				rate : 100,
				min : 0,
				max : 255
			}
		} ]
	} ],
	services : [],
	eventProcessors : [
			{
				id : "eventProcessor1",
				label : "Event Processor 1",
				observables : [ "arduino1.potentiometerRed" ],
				match : "arduino1.potentiometerRed.event.type == 'valueChange'",
				content : {
					type : "script",
					script : "arduino1.rgbLed1.setRedValue({value: arduino1.potentiometerRed.value})"
				}
			},
			{
				id : "eventProcessor2",
				label : "Event Processor 2",
				observables : [ "arduino1.potentiometerGreen" ],
				match : "arduino1.potentiometerGreen.event.type == 'valueChange'",
				content : {
					type : "script",
					script : "arduino1.rgbLed1.setGreenValue({value: arduino1.potentiometerGreen.value})"
				}
			},
			{
				id : "eventProcessor3",
				label : "Event Processor 3",
				observables : [ "arduino1.potentiometerBlue" ],
				match : "arduino1.potentiometerBlue.event.type == 'valueChange'",
				content : {
					type : "script",
					script : "arduino1.rgbLed1.setBlueValue({value: arduino1.potentiometerBlue.value})"
				}
			} ],
	data : []
};
