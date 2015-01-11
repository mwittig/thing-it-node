// Imports

var configuration = require("./configuration");
var node = require("./node");
var bodyParser = require('body-parser')
var express = require('express');
var app = express();
var io = require('socket.io');
var Server = require('socket.io');
var io = new Server({
	transports : [ "websocket" ]
});
var fs = require("fs");

app.use(bodyParser.json());
app.use(function(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
	res.header('Access-Control-Allow-Headers', 'Content-Type');
	next();
});
app.use('/examples', express.static(__dirname + '/examples'));

var server = app
		.listen(
				configuration.port,
				function() {
					var host = server.address().address
					var port = server.address().port

					console.log("\n");
					console
							.log("---------------------------------------------------------------------------");
					console.log(" thing-it Node at http://%s:%s", host, port);
					console.log("\n");
					console
							.log(" Copyright (c) 2014-2015 Marc Gille. All rights reserved.");
					console
							.log("-----------------------------------------------------------------------------");
					console.log("\n");

					initializeNode();
				});

/**
 * 
 */
function initializeNode() {
	// TODO Get rid of the two variables

	var nodeConfiguration = loadNodeConfiguration();
	var activeNode = loadNodeConfiguration();

	activeNode.__simulated = configuration.simulated;

	if (activeNode) {
		activeNode = node.create(activeNode);

		activeNode.start(app, io.listen(server))
	} else {
		console
				.log("No Node Configuration present. Configuration push required.");
	}

	// Initialize REST API for server

	app.get("/plugins", function(req, res) {
		res.send(node.plugins);
	});
	app.get("/state", function(req, res) {
		res.send({
			state : activeNode == null ? "pending" : activeNode.state,
			configuration : nodeConfiguration
		});
	});
	app.get("/configuration", function(req, res) {
		res.send(nodeConfiguration);
	});
	app.post("/configure", function(req, res) {
		if (activeNode) {
			activeNode.stop();
		}

		saveNodeConfiguration(req.body);

		nodeConfiguration = loadNodeConfiguration();
		activeNode = loadNodeConfiguration();

		activeNode = node.create(activeNode);

		res.send("");
	});
	app.post("/start", function(req, res) {
		if (activeNode) {
			activeNode.start(app, io.listen(server)).then(function() {
				res.send("");
			}).fail(function(error) {
				res.status(500).send(error);
			});
		} else {
			res.status(500).send("Node is not configured.");
		}
	});
	app.post("/stop", function(req, res) {
		if (activeNode) {
			activeNode.stop();

			res.send("");
		} else {
			res.send("");
		}
	});
}

/**
 * 
 * @returns
 */
function loadNodeConfiguration() {
	try {
		return JSON.parse(fs.readFileSync(configuration.nodeConfigurationFile,
				{
					encoding : "utf-8"
				}));
	} catch (x) {
		console.log(x);
		console.log("Cannot read node configuration from file "
				+ configuration.nodeConfigurationFile + ".");

		return null;
	}
}

/**
 * 
 * @param node
 */
function saveNodeConfiguration(node) {
	console.log("Persist node configuration");

	fs.writeFileSync(configuration.nodeConfigurationFile, JSON.stringify(node),
			{
				encoding : "utf-8"
			})
}
