module.exports = {
	label : "Home",
	id : "home",
	devices : [ {
		label : "Apple Device Manager",
		id : "appleDeviceManager",
		plugin : "apple-device/appleDevice",
		actors : [ {
			label : "Apple TV",
			id : "appleTv",
			type : "dacpActor",
			configuration : {
				host : "127.0.0.1",
				port : 3689,
				pairingCode : ""
			}
		}, {
			label : "Pairing Agent",
			id : "pairingAgent",
			type : "pairingAgent"
		} ],
		sensors : []
	} ],
	services : [],
	eventProcessors : []
};
