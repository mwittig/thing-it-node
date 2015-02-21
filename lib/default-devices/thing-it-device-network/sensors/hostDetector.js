module.exports = {
	create : function() {
		return new HostDetector();
	}
};

var fs = require('fs');
var process = require('child_process')

/**
 * 
 */
function HostDetector() {
	/**
	 * 
	 */
	HostDetector.prototype.start = function(app, io) {
		this.startSensor(app, io);
		this.lastHosts = {};

		var command = "nmap " + this.configuration.ipRange + " -p "
				+ this.configuration.portRange;

		try {
			if (!this.isSimulated()) {
				var self = this;

				setInterval(function() {
					console.log("Run " + command);

					var e = process.exec(command);
					var report = "";

					e.stdout.on('data', function(chunk) {
						report += chunk;
					});

					e.stdout.on('end', function() {
						self.parseReport(report);
					});

					e.stderr.on('data', function(chunk) {
						console.log(chunk);
					});
				}, this.configuration.interval);
			}
		} catch (x) {
			this.publishMessage("Cannot initialize " + this.device.id + "/"
					+ this.id + ":" + x);
		}
	};

	/**
	 * 
	 */
	HostDetector.prototype.parseReport = function(report) {
		var lines = report.split("\n");

		this.hosts = {};

		for (var n = 0; n < lines.length; ++n) {
			if (lines[n].indexOf("Nmap scan report for ") == 0) {
				var device = lines[n].substring("Nmap scan report for ".length);

				device = device.substring(0, device.indexOf(".home"));

				this.hosts[device] = {};

				if (!this.lastHosts[device]) {
					console.log("======> Fire Event");
					this.change("hostUp");
				}
			}
		}

		console.log(this.hosts);
		
		this.lastHosts = this.hosts;
	};
};