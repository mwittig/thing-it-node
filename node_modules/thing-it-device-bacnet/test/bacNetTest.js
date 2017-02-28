/**
 * This test file allows to run the basic initiation of the
 * BacNet class. It does not, however, simulate full
 * interaction with the node.
 */

//Create Instance of BACnet device
var BacNet = require('../bacNetDevice');

var bacnet = BacNet.create({});

bacnet.isSimulated = function () {
    return true;
};

bacnet.configuration = {
    simulated: true,
    ipAddress: "192.168.0.1",
    bacNetId: "12",
    deviceId: "23"
};

bacnet.publishEvent = function(event, data){
    console.log("Event", event);
};

bacnet.publishStateChange = function(){
    console.log("State Change", this.getState());
};

bacnet.logInfo = function(){
    if (arguments.length == 1 ) {
        console.log(arguments[0]);
    }
    else{
        console.log(arguments);
    }
}

bacnet.logDebug = function(){
    bacnet.logInfo(arguments);
}

bacnet.logError = function(){
    bacnet.logInfo(arguments);
}

//BACnet discovery
console.log("About to discover");
var bacnetdiscovery = BacNet.discovery();
bacnetdiscovery.node = new Object();
bacnetdiscovery.node.isSimulated = function () {
    return true;
};
bacnetdiscovery.start();
bacnetdiscovery.stop();

//Creating unit "binary input" for BACnet
console.log("Build Binary Input");
var BinaryInput = require('../default-units/binaryInput');

var binaryinput = BinaryInput.create({});

binaryinput.isSimulated = function () {
    return true;
};

binaryinput.configuration = {
    simulated: true,
    objectId: "22",
    objectType: "valve",
    objectName: "Air Supply 22",
    description: "Control the air supply in room 22 of the office."
};

binaryinput.publishEvent = function(event, data){
    console.log("Event", event);
};

binaryinput.publishStateChange = function(){
    console.log("State Change", this.getState());
};

binaryinput.logInfo = function(){
    if (arguments.length == 1 ) {
        console.log(arguments[0]);
    }
    else{
        console.log(arguments);
    }
}

binaryinput.logDebug = function(){
    bacnet.logInfo(arguments);
}

binaryinput.logError = function(){
    bacnet.logInfo(arguments);
}

//Creating unit "binary value" for BACnet
console.log("Build Binary Value");
var BinaryValue = require('../default-units/binaryValue');

var binaryvalue = BinaryValue.create({});

binaryvalue.isSimulated = function () {
    return true;
};

binaryvalue.configuration = {
    simulated: true,
    objectId: "23",
    objectType: "valve",
    objectName: "Air Supply 23",
    description: "Control the air supply in room 23 of the office."
};

binaryvalue.publishEvent = function(event, data){
    console.log("Event", event);
};

binaryvalue.publishStateChange = function(){
    console.log("State Change", this.getState());
};

binaryvalue.logInfo = function(){
    if (arguments.length == 1 ) {
        console.log(arguments[0]);
    }
    else{
        console.log(arguments);
    }
}

binaryvalue.logDebug = function(){
    bacnet.logInfo(arguments);
}

binaryvalue.logError = function(){
    bacnet.logInfo(arguments);
}

//Run test
console.log("About to start");
bacnet.start()
    .then(function() {
        //binaryinput.start();
        binaryvalue.start();
    })
    .delay(60000)
    .then(function () {
        //binaryinput.stop();
        binaryvalue.stop();
    })
    .then(function (){
        bacnet.stop();
    })
    .fail(function (error) {
        console.log(error);
    })
    .done(function (){
        console.log('Done');
    });
