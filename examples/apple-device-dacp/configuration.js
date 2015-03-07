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
				host : "192.168.1.7",
				port : 3689,
				pairingCode : "EE53C46CE0B5E4B6"
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
