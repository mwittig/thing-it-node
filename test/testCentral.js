var noble = require('noble');

var serviceUuid = 'fe88997215254b9e96d41a84bcb4cca4';
var characteristicUuid = '8ddf954bc0d3404bad48fdab8523aea6'; // 8ddf954b-c0d3-404b-ad48-fdab8523aea6

noble.on('stateChange', function (state) {
    if (state === 'poweredOn') {
        noble.startScanning([serviceUuid], false);
    }
    else {
        noble.stopScanning();
    }
})

noble.on('discover', function (peripheral) {
    noble.stopScanning();

    console.log('found peripheral:', peripheral.advertisement);

    peripheral.connect(function (error) {
        console.log('Periperal connected');

        peripheral.discoverServices([serviceUuid], function (err, services) {
            console.log('Service retrieved');

            service[0].discoverCharacteristics([], function (err, characteristics) {
                console.log('Characteristic retrieved');

                var buffer = new Buffer(1);
                
                buffer.writeUInt8(2, 0);
                
                pizzaCrustCharacteristic.write(buffer, false, function (error) {
                    if (!error) {
                    } else {
                        console.log('Data written');
                    }
                });
            });
        });
    });
});
