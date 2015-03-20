module.exports = {
    metadata: {
        plugin: "hostDetector",
        label: "Host Detector",
        role: "sensor",
        family: "detector",
        deviceTypes: ["network/network"],
        configuration: [{
            label: "Host Name",
            id: "hostName",
            type: {
                id: "string"
            },
            defaultValue: ""
        }, {
            label: "IP Range",
            id: "ipRange",
            type: {
                id: "string"
            },
            defaultValue: "192.168.0.1-20"
        }, {
            label: "Port Range",
            id: "portRange",
            type: {
                id: "string"
            },
            defaultValue: "62078"
        }, {
            label: "Interval",
            id: "interval",
            type: {
                id: "integer"
            },
            defaultValue: 10000,
            unit: "ms"
        }]
    },
    create: function () {
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
    HostDetector.prototype.start = function () {
        this.lastHosts = {};

        var command = "nmap " + this.configuration.ipRange + " -p "
            + this.configuration.portRange;

        try {
            if (!this.isSimulated()) {
                var self = this;

                setInterval(function () {
                    console.log("Run " + command);

                    var e = process.exec(command);
                    var report = "";

                    e.stdout.on('data', function (chunk) {
                        report += chunk;
                    });

                    e.stdout.on('end', function () {
                        self.parseReport(report);
                    });

                    e.stderr.on('data', function (chunk) {
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
    HostDetector.prototype.parseReport = function (report) {
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