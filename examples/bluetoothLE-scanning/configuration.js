module.exports = {
	label : "Home",
	id : "home",
	devices : [ {
		label : "Bluetooth LE",
		id : "bluetooth-le",
		plugin : "bluetooth-le/bluetooth-le",
		actors : [],
		sensors : [ {
			id : "genericDeviceDetector1",
			label : "Generic Detector 1",
			"type" : "genericDeviceDetector",
			"configuration" : {
				"deviceName" : "BorgPhone",
				"interval" : 10000
			}
		} ]
	} ],
	services : [],
	eventProcessors : []
};
