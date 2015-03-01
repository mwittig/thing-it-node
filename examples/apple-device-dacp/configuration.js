module.exports = {
	label : "Home",
	id : "home",
	devices : [ {
		label : "Apple TV",
		id : "appleTv",
		plugin : "apple-device/appleDevice",
		actors : [], // Device has Default Actor
		sensors : [],
		configuration : {
			host : "127.0.0.1",
			port : 3689,
			pairingCode : ""
		}
	} ],
	services : [],
	eventProcessors : []
};
