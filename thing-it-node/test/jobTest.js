var job = require('../job');

var job1 = {
	id : "job1",
	label : "Job 1",
	description : "One-time job.",
	verbose : true,
	test : true,
	startTimestamp : new Date().getTime() + 10000,
	content : {
		type : "nodeServiceCall",
		service : "toggleLamps"
	}
};

var job2 = {
	id : "job2",
	label : "Job 2",
	description : "Job executed every minute.",
	verbose : true,
	test : true,
	startTimestamp : new Date().getTime() + 2000,
	recurrence : "m",
	factor : 1,
	endAfterOccurences : 3,
	content : {
		type : "actorServiceCall",
		device : "arduino1",
		actor : "lcd1",
		service : "print",
		parameters : {
			text : "Hello"
		}
	}
};

var node = {};

job.bind(node, job1).activate();
job.bind(node, job2).activate();
