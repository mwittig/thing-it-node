module.exports = {
	metadata : {
		plugin : "angelband",
		label : "Angelband",
		sensorTypes : [ {
			plugin : "bloodOxygen",
			label : "BloodOxygen",
			configuration : [ {
				label : "Rate",
				type : "integer",
				defaultValue : 1000,
				unit : "ms"
			} ]
		} ]
	},
	create : function(device) {
		return new Angelband();
	}
};

var utils = require("../../utils");

function Angelband() {
	Angelband.prototype.start = function(app, io, hub) {
		this.startDevice(app, io, hub);
	};
}

//*** Bluetooth

var btSerial = new (require('bluetooth-serial-port')).BluetoothSerialPort();

btSerial.on('found', function(address, name) {
	btSerial.findSerialPortChannel(address, function(channel) {
		btSerial.connect(address, channel, function() {
			console.log('connected');

			btSerial.write(new Buffer('my data', 'utf-8'), function(err,
					bytesWritten) {
				if (err)
					console.log(err);
			});

			btSerial.on('data', function(buffer) {
				console.log(buffer.toString('utf-8'));
			});
		}, function() {
			console.log('cannot connect');
		});

		// close the connection when you're ready
		btSerial.close();
	});
});

btSerial.inquire();
