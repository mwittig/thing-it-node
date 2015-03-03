module.exports = {
	label : "Home",
	id : "home",
	devices : [ {
		label : "Virtual Device",
		id : "virtualDevice",
		plugin : "virtual-device/virtualDevice",
		actors : [],
		sensors : [ {
			id : "button1",
			label : "Button 1",
			type : "button",
			configuration : {}
		}, {
			id : "knob1",
			label : "Knob 1",
			type : "knob",
			configuration : {
				rate : 500,
				min : 0,
				max : 100
			}
		}, {
			id : "slider1",
			label : "Slider 1",
			type : "slider",
			configuration : {
				rate : 500,
				min : 0,
				max : 100
			}
		} ],
	} ],
	groups : [],
	services : [],
	eventProcessors : [],
	data : []
};
