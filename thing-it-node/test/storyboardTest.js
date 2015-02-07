var storyboard = require('../storyboard');

var sample = {
	type : "storyboard",
	id : "storyboard1",
	label : "Storyboard 1",
	description : "Simple service call and state change Storyboard.",
	verbose : true,
	test : true,
	easingInterval : 500,
	timeline : [ {
		timestamp : 0,
		entries : [ {
			type : "nodeServiceCall",
			service : "toggleLamps"
		} ]
	}, {
		timestamp : 2000,
		entries : [ {
			type : "nodeServiceCall",
			service : "toggleLamps"
		}, {
			type : "actorServiceCall",
			device : "arduino1",
			actor : "lcd1",
			service : "print",
			parameters : {
				text : "Hello"
			}
		} ]
	}, {
		timestamp : 5000,
		entries : [ {
			type : "nodeServiceCall",
			service : "toggleLamps"
		}, {
			type : "actorStateChange",
			device : "arduino1",
			actor : "rgbLed1",
			state : {
				red : 128,
				green : 10,
				blue : 200
			},
			easing : "linear"
		} ]
	}, {
		timestamp : 8000,
		entries : [ {
			type : "actorStateChange",
			device : "arduino1",
			actor : "rgbLed1",
			state : {
				red : 0,
				green : 0,
				blue : 0
			},
			easing : "linear"
		} ]
	} ]
};

var node = {};

storyboard.bind(node, sample);

node.storyboard1();