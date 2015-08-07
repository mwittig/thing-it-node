module.exports = {
	label : "Home",
	id : "home",
	devices : [ {
		label : "Arduino Uno 1",
		id : "arduino1",
		plugin : "microcontroller/arduino",
		actors : [ {
			id : "servo1",
			label : "Servo 1",
			type : "servo",
			configuration : {
				pin : 10,
				minimum : 45,
				maximum : 135,
				startAt : 120
			}
		} ],
		sensors : []
	} ],
	groups : [],
	services : [
			{
				id : "service1",
				label : "Step Left",
				type : "script",
				content : {
					script : "arduino1.servo1.toPosition({position: Math.max(arduino1.servo1.state.position - 10, arduino1.servo1.configuration.minimum)});"
				}
			},
			{
				id : "service2",
				label : "Step Right",
				type : "script",
				content : {
					script : "arduino1.servo1.toPosition({position: Math.min(arduino1.servo1.state.position + 10, arduino1.servo1.configuration.maximum)});"
				}
			} ],
	eventProcessors : [],
	data : []
};
