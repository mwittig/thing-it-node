module.exports = {
	label : "Home",
	id : "home",
	devices : [ {
		label : "Apple TV",
		id : "appleTv",
		plugin : "apple-device/appleDevice",
		actors : [ {
			label : "Apple TV",
			id : "appleTv",
			type : "dacpActor",
		} ],
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
