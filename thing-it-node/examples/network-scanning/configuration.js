module.exports = {
	label : "Home",
	id : "home",
	devices : [ {
		label : "Network Utilities",
		id : "networkUtilities",
		plugin : "network",
		actors : [],
		sensors : [ {
			id : "hostDetector1",
			label : "Host Detector 1",
			"type" : "hostDetector",
			"configuration" : {
				"hostName" : "ZorgPhone",
				"interval" : 10000,
				"ipRange" : "192.168.0.1-20",
				"portRange" : "62078"
			}
		} ]
	} ],
	services : [],
	eventProcessors : []
};
