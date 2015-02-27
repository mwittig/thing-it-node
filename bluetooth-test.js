var btSerial = new (require('bluetooth-serial-port')).BluetoothSerialPort();

btSerial.on('found', function(address, name) {
	console.log("found " + address + " " + name);

	if (address == "00-11-67-e0-98-cf") {
		btSerial.findSerialPortChannel(address, function(channel) {
			btSerial.connect(address, channel, function() {
				console.log('connected');

				// btSerial.write(new Buffer('my data', 'utf-8'), function(err,
				// bytesWritten) {
				// if (err)
				// console.log(err);
				// });

				btSerial.on('data', function(buffer) {
					parse(buffer);
				});
			}, function() {
				console.log('cannot connect');
			});

			// close the connection when you're ready
			btSerial.close();
		}, function() {
			console.log('found nothing');
		});
	}
});

// btSerial.listPairedDevices(function(list) {
// console.log(list);
//
// for ( var n in list) {
// console.log("Device " + list[n].name);
//
// for ( var m in list[n].services) {
// console.log("\tService " + list[n].services[m].name);
// console.log(list[n].services[m]);
// }
// }
// });

btSerial.inquire();


