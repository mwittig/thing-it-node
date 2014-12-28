// Imports

var configuration = require("./configuration");
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

					//initializeNode();
				});

/**
 * 
 */
function initializeNode() {
	var arduino = require("./plugins/arduino/plugin");
	var angelband = require("./plugins/angelband/plugin");
	var metadata = [ arduino.metadata, angelband.metadata ];
	var nodeConfiguration = loadNodeConfiguration();
	var node = loadNodeConfiguration();

	if (node) {
		node = require("./node").create(node);

		node.start(app, io.listen(server))
	} else {
		console
				.log("No Node Configuration present. Configuration push required.");
	}

	// Initialize REST API

	app.get("/plugins", function(req, res) {
		res.send(metadata);
	});
	app.get("/state", function(req, res) {
		res.send({
			state : node == null ? "pending" : node.state,
			configuration : nodeConfiguration
		});
	});
	app.get("/configuration", function(req, res) {
		res.send(nodeConfiguration);
	});
	app.post("/configure", function(req, res) {
		if (node) {
			node.stop();
		}

		saveNodeConfiguration(req.body);

		nodeConfiguration = loadNodeConfiguration();
		node = loadNodeConfiguration();

		node = require("./node").create(node);

		res.send("");
	});
	app.post("/start", function(req, res) {
		if (node) {
			node.start(app, io.listen(server));
			res.send("");
		} else {
			res.send("Node is not configured.");
		}
	});
	app.post("/stop", function(req, res) {
		if (node) {
			node.stop();

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
