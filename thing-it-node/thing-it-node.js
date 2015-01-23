// Imports

var options = require("./options");
var node = require("./node");
var bodyParser = require('body-parser')
var express = require('express');
var app = express();
var Server = require('socket.io');
var io = new Server({
	transports : [ "websocket" ]
});
var crypto = require('crypto');
var ursa = require('ursa');
var fs = require('fs');

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
				options.port,
				function() {
					var host = server.address().address
					var port = server.address().port

					console.log("\n");
					console
							.log("---------------------------------------------------------------------------");
					console.log(" thing-it-node at http://%s:%s", host, port);
					console.log("\n");
					console.log(" Node Configuration File: %s",
							options.nodeConfigurationFile);
					console.log(" Simulated              : %s",
							options.simulated);
					console.log(" Hot Deployment         : %s",
							options.hotDeployment);
					console.log(" Verify Call Signature  : %s",
							options.verifyCallSignature);
					console.log(" Public Key File        : %s",
							options.publicKeyFile);
					console.log(" Signing Algorithm      : %s",
							options.signingAlgorithm);
					console.log("\n");
					console
							.log(" Copyright (c) 2014-2015 Marc Gille. All rights reserved.");
					console
							.log("-----------------------------------------------------------------------------");
					console.log("\n");

					try {
						testCrypto();
						// node.bootstrap(options, app, io, server);
					} catch (x) {
						console.error("Cannot start node: " + x);
						process.exit();
					}
				});

function testCrypto() {
	var privateKey = '-----BEGIN RSA PRIVATE KEY-----\n'
			+ 'MIICXQIBAAKBgQDCtTEic76GBqUetJ1XXrrWZcxd8vJr2raWRqBjbGpSzLqa3YLv\n'
			+ 'VxVeK49iSlI+5uLX/2WFJdhKAWoqO+03oH4TDSupolzZrwMFSylxGwR5jPmoNHDM\n'
			+ 'S3nnzUkBtdr3NCfq1C34fQV0iUGdlPtJaiiTBQPMt4KUcQ1TaazB8TzhqwIDAQAB\n'
			+ 'AoGAM8WeBP0lwdluelWoKJ0lrPBwgOKilw8W0aqB5y3ir5WEYL1ZnW5YXivS+l2s\n'
			+ 'tNELrEdapSbE9hieNBCvKMViABQXj4DRw5Dgpfz6Hc8XIzoEl68DtxL313EyouZD\n'
			+ 'jOiOGWW5UTBatLh05Fa5rh0FbZn8GsHrA6nhz4Fg2zGzpyECQQDi8rN6qhjEk5If\n'
			+ '+fOBT+kjHZ/SLrH6OIeAJ+RYstjOfS0bWiM9Wvrhtr7DZkIUA5JNsmeANUGlCrQ2\n'
			+ 'cBJU2cJJAkEA26HyehCmnCkCjit7s8g3MdT0ys5WvrAFO6z3+kCbCAsGS+34EgnF\n'
			+ 'yz8dDdfUYP410R5+9Cs/RkYesqindsvEUwJBALCmQVXFeKnqQ99n60ZIMSwILxKn\n'
			+ 'Dhm6Tp5Obssryt5PSQD1VGC5pHZ0jGAEBIMXlJWtvCprScFxZ3zIFzy8kyECQQDB\n'
			+ 'lUhHVo3DblIWRTVPDNW5Ul5AswW6JSM3qgkXxgHfYPg3zJOuMnbn4cUWAnnq06VT\n'
			+ 'oHF9fPDUW9GK3yRbjNaJAkAB2Al6yY0KUhYLtWoEpQ40HlATbhNel2cn5WNs6Y5F\n'
			+ '2hedvWdhS/zLzbtbSlOegp00d2/7IBghAfjAc3DE9DZw\n'
			+ '-----END RSA PRIVATE KEY-----';

	var publicKey = '-----BEGIN PUBLIC KEY-----\n'
			+ 'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDCtTEic76GBqUetJ1XXrrWZcxd\n'
			+ '8vJr2raWRqBjbGpSzLqa3YLvVxVeK49iSlI+5uLX/2WFJdhKAWoqO+03oH4TDSup\n'
			+ 'olzZrwMFSylxGwR5jPmoNHDMS3nnzUkBtdr3NCfq1C34fQV0iUGdlPtJaiiTBQPM\n'
			+ 't4KUcQ1TaazB8TzhqwIDAQAB\n' + '-----END PUBLIC KEY-----';

	var signer = crypto.createSign('sha256');

	signer.update("hola");

	var sign = signer.sign(privateKey, 'base64');

	var verifier = crypto.createVerify('sha256');

	verifier.update("hola");

	var ver = verifier.verify(publicKey, sign, 'base64');

	console.log(ver);// <--- always false!

	// Encryption decryption

	var crt = ursa.createPrivateKey(privateKey);
	var key = ursa.createPublicKey(publicKey);

	msg = key.encrypt("Hallo", 'utf8', 'base64');
	msg = crt.decrypt(msg, 'base64', 'utf8');

	console.log(msg);
}
