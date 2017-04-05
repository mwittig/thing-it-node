var dgram = require('dgram');
var q = require('q');
var _ = require('underscore');

var bvlc = new BVLC();
var npdu = new NPDU();
var apdu = new APDU();

/**
 *
 * @constructor
 */
function BACnetTestController() {
}

/**
 * @param host
 * @param port
 */
BACnetTestController.prototype.initialize = function (port, host) {
    var deferred = q.defer();
    console.log('test controller initialize');
    this.udpServer = dgram.createSocket('udp4');

    this.listeners = [];

    this.udpServer.on('listening', function () {
        var address = this.udpServer.address();

        deferred.resolve();
        console.log('UDP Server listening on ' + address.address + ":" + address.port);
    }.bind(this));

    this.udpServer.on('message', function (message, remote) {
        console.log('Received UDP message from ' + remote.address + ':' + remote.port);

        //check out message
        //console.log(message);
        //console.log(Buffer.isBuffer(message));
        //console.log(Buffer.isEncoding('utf-8'))

        //encodings
        //console.log('hex - ' + message.toString('hex'));
        //console.log('ascii - ' + message.toString('ascii'));
        //console.log('base64 - ' + message.toString('base64'));
        //console.log('utf8 - ' + message.toString('utf-8'));

        this.handleMessage(message);
        /*
        //buffer -> string -> JSON
        var messageBody = message.toString('utf-8');
        console.log(messageBody); //utf-8 is the default

        var messageJSON = JSON.parse(messageBody);
        console.log(messageJSON);

        //building response
        var responseBody = '';

        if (messageJSON.type == 'RP') {
            console.log('responding read property');
            messageJSON.propertyValue = Math.random() * 100;
            messageJSON.status = 1;
        }

        if (messageJSON.type == 'WP') {
            console.log('responding write property');
            messageJSON.status = 1;
        }

        if (messageJSON.type == 'SCOV') {
            console.log('try matching listener');
            //TODO: find a better way to match for more critera then only propertyId
            var matchingListener = _.find(this.listeners, {host: remote.address, port: remote.port, objectId: messageJSON.objectId, propertyId: messageJSON.propertyId});

            if (matchingListener) {
                console.log('listener ' + messageJSON.propertyId + ' already exists');
                messageJSON.status = 2;
            } else {
                console.log('listener ' + messageJSON.propertyId + ' registered');
                var listener = {
                    host: remote.address,
                    port: remote.port,
                    bacNetId: messageJSON.bacNetId,
                    deviceId: messageJSON.deviceId,
                    objectId: messageJSON.objectId,
                    propertyId: messageJSON.propertyId
                };
                this.listeners.push(listener);
                messageJSON.status = 1;
            }
        }

        if (messageJSON.type == 'USCOV') {
            console.log('try matching listener');
            //TODO: find a better way to match for more critera then only propertyId
            var matchingListener = _.find(this.listeners, {host: remote.address, port: remote.port, objectId: messageJSON.objectId, propertyId: messageJSON.propertyId});

            if (matchingListener) {
                this.listeners = _.without(this.listeners, matchingListener);
                console.log('listener ' + messageJSON.propertyId + ' removed');
                messageJSON.status = 1;
            } else {
                console.log('listener ' + messageJSON.propertyId + ' did not exist');
                messageJSON.status = 2;
            }
        }

        responseBody = JSON.stringify(messageJSON);
        console.log(responseBody);

        //sending response
        this.udpServer.send(responseBody, 0, responseBody.length, remote.port, remote.address, function (err, bytes) {
            if (err) {
                throw err;
            }

            console.log('UDP Server message sent to ' + remote.address + ':' + remote.port);
        }.bind(this));

        */
    }.bind(this));


    /*
    //TODO: maybe set up better simulation data for notifications
    this.interval = setInterval(function () {
        var d = new Date();
        var time = d.getTime();

        for (l in this.listeners) {
            var listener = this.listeners[l];
            console.log(listener);

            var messageJSON = {
                time: time,
                //Confirmed COV Notification
                type: 'CCOVN',
                bacNetId: listener.bacNetId,
                deviceId: listener.deviceId,
                objectId: listener.objectId,
                propertyId: listener.propertyId,
                propertyValue: Math.random() * 200
            };

            var responseBody = JSON.stringify(messageJSON);

            this.udpServer.send(responseBody, 0, responseBody.length, listener.port, listener.host, function (err, bytes) {
                if (err) {
                    throw err;
                }

                console.log('UDP Server message sent to ' + listener.host + ':' + listener.port);
            }.bind(this));

        }
    }.bind(this), 10000);
    */

    if (host) {
        this.udpServer.bind(port, host);
    } else {
        this.udpServer.bind(port);
    }

    return deferred.promise;
};

BACnetTestController.prototype.stop = function () {
    this.udpServer.close();
};

BACnetTestController.prototype.send = function (buffer, offset, length, port, address) {
    if (address == '255.255.255.255') {
        this.udpServer.setBroadcast(true);
    }

    this.udpServer.send(buffer, offset, length, port, address, function (err, bytes) {
        if (err) {
            throw err;
        }
        console.log('UDP Server message sent to ' + address + ':' + port);
        this.udpServer.setBroadcast(false);
    }.bind(this));
};

BACnetTestController.prototype.handleMessage = function (buffer) {
    console.log(buffer);
    var result = {};
    var offset = new Offset();

    result.bvlc = bvlc.read(buffer, offset);
    result.npdu = npdu.read(buffer, offset);
    result.apdu = apdu.read(buffer, offset);
    console.log(result);
};

BACnetTestController.prototype.whoIs = function (address) {
    var address = address;

    if (!address) {
        address = '255.255.255.255';
    }

    var bvlc = '810b000c';
    var npdu = '0120ffff00ff';
    var apdu = '1008';

    var m = bvlc + npdu + apdu;

    var buffer = Buffer.from(m, 'hex');

    console.log(buffer);
    this.send(buffer, 0, buffer.length, 47808, address);
};

BACnetTestController.prototype.readProperty = function (address, objectType, objectId, property) {
    var invokeId = 1;
    var serviceChoice = 12; // this is the number for service read property
    //TODO: Size of buffer needs to be adjusted dynamically
    var buffer = Buffer.alloc(50);
    var offset = new Offset(4);

    npdu.write(buffer, offset);
    apdu.write(buffer, offset, invokeId, serviceChoice);
    apdu.writeObject(buffer, offset, 0, objectType, objectId);
    apdu.writeProperty(buffer, offset, 1, property);
    bvlc.write(buffer, offset);

    console.log(buffer);
    this.send(buffer, 0, buffer.length, 47808, address);
};

BACnetTestController.prototype.writeProperty = function (address, objectType, objectId, property, dataType, propertyValue, priority) {
    var invokeId = 1;
    var serviceChoice = 15;
    //TODO: Size of buffer needs to be adjusted dynamically
    var buffer = Buffer.alloc(50);
    var offset = new Offset(4);

    npdu.write(buffer, offset);
    apdu.write(buffer, offset, invokeId, serviceChoice);
    apdu.writeObject(buffer, offset, 0, objectType, objectId);
    apdu.writeProperty(buffer, offset, 1, property);
    apdu.writeValue(buffer, offset, 3, dataType, propertyValue);
    apdu.writeTaggedParameter(buffer, offset, 4, priority);
    bvlc.write(buffer, offset);

    console.log(buffer);
    this.send(buffer, 0, buffer.length, 47808, address);
};

BACnetTestController.prototype.subscribeCOV = function (address, objectType, objectId, processId, isConfirmed, lifeTime) {
    var invokeId = 1;
    var serviceChoice = 5; // this is the number for service subscribeCOV

    //TODO: Size of buffer needs to be adjusted dynamically
    var buffer = Buffer.alloc(50);
    var offset = new Offset(4);

    npdu.write(buffer, offset);
    apdu.write(buffer, offset, invokeId, serviceChoice);
    apdu.writeTaggedParameter(buffer, offset, 0, processId);
    apdu.writeObject(buffer, offset, 1, objectType, objectId);
    if (isConfirmed != undefined) {
        apdu.writeTaggedParameter(buffer, offset, 2, isConfirmed);
    }
    if (lifeTime != undefined) {
        apdu.writeTaggedParameter(buffer, offset, 3, lifeTime);
    }
    bvlc.write(buffer, offset);

    console.log(buffer);
    this.send(buffer, 0, buffer.length, 47808, address);
};



function BVLC() {
}

BVLC.prototype.write = function (buffer, offset, messageFunction) {
    //1st byte type, is always the same indicating
    //2nd byte function of message, that is unicast (e.g. readProperty) or broadcast (e.g. whoIs)

    var type = 0x81;
    var func = 0x0a;
    if (messageFunction == 'broadcast') {
        func = 0x0b;
    }
    var len = offset.set(0);

    buffer.writeUInt8(type, offset.up());
    buffer.writeUInt8(func, offset.up());
    buffer.writeUInt16BE(len, offset.up());
};

BVLC.prototype.read = function (buffer, offset) {
    var bvlc = {};

    bvlc.type = buffer.readUInt8(offset.up());
    bvlc.func = buffer.readUInt8(offset.up());
    bvlc.length = buffer.readUInt16BE(offset.up(2));

    return bvlc;
};

function NPDU() {
};

NPDU.prototype.write = function (buffer, offset) {
    //1st byte version
    //2nd byte type

    var version = 0x01; // Version: 0x01 (ASHRAE 135-1995)
    var type = 0x04; // 0x04 indicates reply expected

    buffer.writeUInt8(version, offset.up());
    buffer.writeUInt8(type, offset.up());
};

NPDU.prototype.read = function (buffer, offset) {
    var npdu = {};

    npdu.version = buffer.readUInt8(offset.up());

    var control = buffer.readUInt8(offset.up());
    npdu.control = {};
    npdu.control.noApduMessageType = control >> 7;
    npdu.control.reserved1 = (control >> 6) & 0x01;
    npdu.control.destinationSpecifier = (control >> 5) & 0x01;
    npdu.control.reserved2 = (control >> 4) & 0x01;
    npdu.control.sourceSpecifier = (control >> 3) & 0x01;
    npdu.control.expectingReply = (control >> 2) & 0x01;
    npdu.control.priority1 = (control >> 1) & 0x01;
    npdu.control.priority2 = control & 0x01;

    if (npdu.control.destinationSpecifier == 1) {
        npdu.destinationNetworkAddress = buffer.readUInt16BE(offset.up(2));
        npdu.destinationMacLayerAddressLength = buffer.readUInt8(offset.up());
        npdu.hopCount = buffer.readUInt8(offset.up());
    }

    return npdu;
};

function APDU() {
};

APDU.prototype.write = function (buffer, offset, invokeId, serviceChoice) {
    //1st byte apdu type & pdu flags
    //2nd byte max response segments accepted & size of maximum adpu accepted
    //3rd byte invokeId
    //4th byte service choice

    var type = 0x0; //0 is confirmed request
    var flags = 0x0; //there are different things encoded in here
    var maxRespSegments = 0x0; //0 means unspecified
    var maxSizeADPU = 0x5; //5 means up to 1476 octets are accepted

    buffer.writeUInt8((type << 4) | flags, offset.up());
    buffer.writeUInt8((maxRespSegments << 4) | maxSizeADPU, offset.up());
    buffer.writeUInt8(invokeId, offset.up());
    buffer.writeUInt8(serviceChoice, offset.up());
};

APDU.prototype.writeTag = function (buffer, offset, contextTagNumber, tagClass, tagValue) {
    //contextTagNumber has 4 bits, tagClass 1 bit and tagValue 3 bits
    var tagByte = (contextTagNumber << 4) | (tagClass << 3) | tagValue;
    buffer.writeUInt8(tagByte, offset.up());
};

APDU.prototype.writeObject = function (buffer, offset, context, objectType, objectId) {
    //objectType has 10 bits and objectId has 22bits
    var objectBytes = (objectType << 22) | objectId;
    this.writeTag(buffer, offset, context, 1, 4);
    buffer.writeUInt32BE(objectBytes, offset.up(4));
};

APDU.prototype.writeProperty = function (buffer, offset, context, propertyKey) {
    this.writeTag(buffer, offset, context, 1, 1);
    buffer.writeUInt8(propertyKey, offset.up());
};

APDU.prototype.writeValue = function (buffer, offset, context, dataType, propertyValue) {
    //TODO: only dataType 2 (unsigned int), 4 (real/float), 9 (enumerated) are supported by this code
    var len = 1; //lenght 1 byte is sufficient for dataType 2 (unsigned int) and dataType 9 (enumerated)
    if (dataType == 4) {
        len = 4; //dataType 4 is a real/float, which is 4 bytes
    }

    //openTag
    apdu.writeTag(buffer, offset, context, 1, 6);
    //tag indicating dataType of value
    apdu.writeTag(buffer, offset, dataType, 0, len);
    //value
    if (dataType == 2) {
        //unsigned int
        buffer.writeUInt8(propertyValue, offset.up(len));
    } else if (dataType == 4) {
        //real/float
        buffer.writeFloatBE(propertyValue, offset.up(len));
    } else if (dataType == 9) {
        //enumerated
        buffer.writeUInt8(propertyValue, offset.up(len));
    } else {
        //unsupported datatype
        buffer.writeUInt8(propertyValue, offset.up(len));
    }
    //closeTag
    apdu.writeTag(buffer, offset, context, 1, 7);
};

APDU.prototype.writeTaggedParameter = function (buffer, offset, context, param) {
    apdu.writeTag(buffer, offset, context, 1, 1);
    buffer.writeUInt8(param, offset.up());
};

APDU.prototype.read = function (buffer, offset, result) {
    var apdu = {};
    var firstByte = buffer.readUInt8(offset.up());
    apdu.type = firstByte >> 4;

    if (apdu.type == 1) {
        console.log('UNCONFIRMED REQUEST');
        apdu.serviceChoice = buffer.readUInt8(offset.up());
        if (apdu.serviceChoice == 2) {
            console.log('unconfirmedCOVNotification');
            var unconfirmedCOVNotification = {};
            unconfirmedCOVNotification.processId = this.readTaggedParameter(buffer, offset);
            unconfirmedCOVNotification.device = this.readObject(buffer, offset);
            unconfirmedCOVNotification.object = this.readObject(buffer, offset);
            unconfirmedCOVNotification.lifeTime = this.readTaggedParameter(buffer, offset);
            unconfirmedCOVNotification.listOfValues = this.readListOfValues(buffer, offset);
            apdu.unconfirmedCOVNotification = unconfirmedCOVNotification;
        }
    } else if (apdu.type == 2) {
        console.log('SIMPLE ACK');
        apdu.invokeId = buffer.readUInt8(offset.up());
        apdu.serviceChoice = buffer.readUInt8(offset.up());
        if (apdu.serviceChoice == 5) {
            console.log('successfully subscribed');
        } else if (apdu.serviceChoice == 12) {
            console.log('write property successful');
        }
    } else if (apdu.type == 3) {
        console.log('COMPLEX ACK');
        apdu.pduFlags = {};
        apdu.pduFlags.segmentedRequest = (firstByte >> 3) & 0x01;
        apdu.pduFlags.moreSegments = (firstByte >> 2) & 0x01;
        apdu.invokeId = buffer.readUInt8(offset.up());
        apdu.serviceChoice = buffer.readUInt8(offset.up());

        if (apdu.serviceChoice == 12) {
            console.log('READ PROPERTY');
            var readProperty = {};
            readProperty.object = this.readObject(buffer, offset);
            readProperty.property = this.readProperty(buffer, offset);
            readProperty.propertyValue = this.readValue(buffer, offset);
            apdu.readProperty = readProperty;
        }
    } else if (apdu.type == 5) {
        console.log('ERROR');
    } else {
        console.log('APDU TYPE ' + result.apdu.type + 'not handled yet.')
    }
    return apdu;
};

APDU.prototype.readTag = function (buffer, offset) {
    var tag = {};
    var byte = buffer.readUInt8(offset.up());
    tag.tagNumber = byte >> 4;
    tag.tagClass = (byte >> 3) & 0x01;
    tag.tagValue = byte & 0x07;
    return tag;
};

APDU.prototype.readObject = function (buffer, offset) {
    var obj = {};
    obj.tag = this.readTag(buffer, offset);
    var bytes = buffer.readUInt32BE(offset.up(4));
    obj.objectType = bytes >> 22;
    obj.objectId = (obj.objectType << 22) ^ bytes;
    console.log(obj);
    return obj;
};

APDU.prototype.readProperty = function (buffer, offset) {
    var property = {};
    property.tag = this.readTag(buffer, offset);
    property.propertyKey = buffer.readUInt8(offset.up());
    console.log(property);
    return property;
};

APDU.prototype.readValue = function (buffer, offset) {
    var value = {};
    var openTag = this.readTag(buffer, offset);
    value.tag = this.readTag(buffer, offset);
    value.propertyValue;

    if (value.tag.tagNumber == 2) {
        //unsigned int
        value.propertyValue = buffer.readUInt8(offset.up());
    } else if (value.tag.tagNumber == 4) {
        //real/float
        value.propertyValue = buffer.readFloatBE(offset.up(4));
    } else if (value.tag.tagNumber == 8) {
        //bit string
        value.unusedBits = buffer.readUInt8(offset.up());
        var bitString = buffer.readUInt8(offset.up());
        //TODO: look up which exact bit corresponds to which status flag. for now it is in order the first four bits from the left
        value.inAlarm = bitString >> 7;
        value.fault = (bitString >> 6) & 0x01;
        value.overridden = (bitString >> 5) & 0x01;
        value.outOfService = (bitString >> 4) & 0x01;
    } else if (value.tag.tagNumber == 9) {
        //enum/binary
        value.propertyValue = buffer.readUInt8(offset.up());
    } else {
        console.log('Unsupported DataType - Please look up which data type corresponds to the following info');
        console.log('tagNumber - ' + value.tag.tagNumber);
        console.log('tagClass - ' + value.tag.tagClass);
        console.log('tagValueValue - ' + value.tag.tagValue);
        value.propertyValue = buffer[offset.up()];
        console.log('propertyValue - (Needs to be converted) ' + value.propertyValue);
    }

    var closeTag = this.readTag(buffer, offset);
    console.log(value);
    return value;
};

APDU.prototype.readListOfValues = function (buffer, offset) {
    var listOfValues = {};
    var openTag = this.readTag(buffer, offset);
    listOfValues.property = this.readProperty(buffer, offset);
    listOfValues.propertyValue = this.readValue(buffer, offset);
    listOfValues.statusFlags = this.readProperty(buffer, offset);
    listOfValues.statusFlagsValue = this.readValue(buffer, offset);
    var closeTag = this.readTag(buffer, offset);
    return listOfValues;
};

APDU.prototype.readTaggedParameter = function (buffer, offset) {
    var taggedParam = {};
    taggedParam.tag = this.readTag(buffer, offset);
    taggedParam.value = buffer.readUInt8(offset.up());
    console.log(taggedParam);
    return taggedParam;
};

function Offset(value) {
    this.offset = 0;
    if (value != undefined) {
        this.offset = value;
    }
};

Offset.prototype.get = function (value) {
    return this.offset;
};

Offset.prototype.set = function (value) {
    var prev = new Number(this.offset);
    this.offset = value;
    return prev;
};

Offset.prototype.up = function (diff) {
    if (!diff) {
        diff = 1;
    }

    this.offset = this.offset + diff;
    return this.offset - diff;
};

Offset.prototype.down = function (diff) {
    if (!diff) {
        diff = 1;
    }

    this.offset = this.offset - diff;
    return this.offset + diff;
};

//START TEST CONTROLLER

//var SERVER_HOST = '127.0.0.1';
//var SERVER_HOST = '192.168.0.103';
// BACnet default PORT
var SERVER_PORT = 47808;

var testController = new BACnetTestController();
//testController.initialize(SERVER_PORT, 'localhost');
testController.initialize(SERVER_PORT)
    .then(function() {
        testController.whoIs();
        //tests for read in the following order: binaryValue, analogValue, multiStateValue
        //testController.readProperty('192.168.0.108', 5, 12, 85);
        //testController.readProperty('192.168.0.108', 2, 69, 85);
        //testController.readProperty('192.168.0.108', 19, 26, 85);
        //tests for write in the following order: binaryValue, analogValue, multiStateValue
        //testController.writeProperty('192.168.0.108', 5, 12, 85, 9, 0, 16);
        //testController.writeProperty('192.168.0.108', 2, 69, 85, 4, 16, 16);
        //testController.writeProperty('192.168.0.108', 19, 26, 85, 2, 4, 16);
        //tests for subscribe
        //testController.subscribeCOV('192.168.0.108', 5, 12, 1, 0, 0);
        //testController.subscribeCOV('192.168.0.108', 2, 69, 1, 0, 0);
        //testController.subscribeCOV('192.168.0.108', 19, 26, 1, 0, 0);
        //cancel subscription
        //testController.subscribeCOV('192.168.0.108', 5, 12, 1);
    }.bind(this));