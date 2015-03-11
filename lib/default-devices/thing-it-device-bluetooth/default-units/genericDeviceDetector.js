module.exports = {
	metadata : {
		plugin : "genericDeviceDetector",
		label : "Generic Device Detector",
		role : "sensor",
		family : "detector",
		deviceTypes : [ "bluetooth/bluetooth" ],
		configuration : [ {
			label : "Device Name",
			id : "deviceName",
			type : {
				id : "string"
			},
			defaultValue : ""
		}, {
			label : "Interval",
			id : "interval",
			type : {
				id : "integer"
			},
			defaultValue : 10000,
			unit : "ms"
		} ]
	},
	create : function() {
		return new GenericDeviceDetector();
	}
};

var fs = require('fs');
var process = require('child_process')
var bluetooth = require('bluetooth-serial-port');

var bluetoothSerialPort = bluetooth.BluetoothSerialPort();

/**
 * 
 */
function GenericDeviceDetector() {
	/**
	 * 
	 */
	GenericDeviceDetector.prototype.start = function(app, io) {
		this.startSensor(app, io);

		try {
			if (!this.isSimulated()) {
				var self = this;

				setInterval(
						function() {
							console.log("Run " + command);

							bluetoothSerialPort
									.on(
											'found',
											function(address, name) {
												bluetoothSerialPort
														.findSerialPortChannel(
																address,
																function(
																		channel) {
																	bluetoothSerialPort
																			.connect(
																					address,
																					channel,
																					function() {
																						console
																								.log('connected');

																						console
																								.log("ArDrone connected");

																						bluetoothSerialPort
																								.write(
																										new Buffer(
																												'my data',
																												'utf-8'),
																										function(
																												err,
																												bytesWritten) {
																											if (err)
																												console
																														.log(err);
																										});

																						bluetoothSerialPort
																								.on(
																										'data',
																										function(
																												buffer) {
																											console
																													.log(buffer
																															.toString('utf-8'));
																										});
																					},
																					function() {
																						console
																								.log('cannot connect');
																					});

																	// close the
																	// connection
																	// when
																	// you're
																	// ready
																	bluetoothSerialPort
																			.close();
																});

												console.log("Before inquire");
												bluetoothSerialPort.inquire();
											});

						}, this.configuration.interval);
			}
		} catch (x) {
			this.publishMessage("Cannot initialize " + this.device.id + "/"
					+ this.id + ":" + x);
		}
	};
};