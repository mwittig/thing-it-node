module.exports = {
	label : "Home",
	id : "home",
	devices : [ {
		label : "Network Utilities",
		id : "networkUtilities",
		plugin : "network/network",
		actors : [],
		sensors : [ {
			id : "hostDetector1",
			label : "Host Detector 1",
			"type" : "hostDetector",
			"configuration" : {
				"interval" : 10000,
				"ipRange" : "192.168.1.1-20",
				"portRange" : "62078"
			}
		} ]
	} ],
	services : [],
	eventProcessors : [ {
		id : "eventProcessor1",
		label : "Event Processor 1",
		observables : [ "networkUtilities.hostDetector1" ],
		match : "networkUtilities.hostDetector1.event.type == 'hostUp'",
		type : "script",
		content : {
			script : "lastHost.name = networkUtilities.hostDetector1.event.data; lastHost.time = new Date();"
		}
	} ],
	data : [ {
		id : "lastHost",
		label : "Last Host",
		type : "any"
	}, {
		id : "lightingConfigurations",
		label : "Lighting Configurations",
		type : "any"
	} ]
};
