'use strict';

const dgram = require('dgram');

const util = require('./bacNetUtil.js');
const apdusvc = require('./apdu.js');
var Message = require('./message.js');


function BACnetIPNetwork () {

    const localNetworkNumber = 0; // should come from configuration
    const port = "9990"; // should come from configuration
    const multicastaddr = "224.0.0.114"; // should come from configuration
    const ALL_NETWORKS = 0xFFFF; // should come from configuration
    const BVLC_TYPE = 0x81; // should come from configuration

    var server;

    var networkRouters = [];

    BACnetIPNetwork.prototype.init = function () {
        server = dgram.createSocket('udp4');

        server.on('error', function (err) {
            console.log('server error:\n' + err.stack);
            server.close();
        });

        server.on('message', function (msg, rinfo) {
            var linkService = rinfo.address + ':' + rinfo.port;

            console.log('server got: ' + msg + ' from ' + linkService);

            var queue = new ByteQueue(msg);

            var message = this.readNPDU(queue, linkService);

            if (!message.isNetworkMsg()) {
                this.processADPUData(message);
            }
        });


        server.on('listening', function () {
            var address = server.address();
            console.log('server listening' + server.address + ':' + server.port);
        });

        // could even call without port
        server.bind(port, function () {
            server.addMembership(multicastaddr);
        });

        server.ref();
    };

    BACnetIPNetwork.prototype.readNPDU = function (queue, linkService) {
        // Networktype        if (util.isBitSet(control,5)) {

        var networkType = queue.readUInt8();

        if (networkType != BVLC_TYPE) {
            console.log('ERROR: Protocol id is not BACnet/IP (0x81');
            return;
        }

        var msgFunction = queue.readUInt8();
        var length = queue.readInt16();
        if (length != queue.size()) {
            console.log('Length field does not match data: given=' + length + ', expected=' + (queue.size()));
        }

        var msg = null;

        if (msgFunction == 0x0)
        // we don't do BBMD (BACnet Broadcast Management Device)
            ;
        /*
        else if (msgFunction == 0x1)
        // Write-Broadcast-Distribution-Table
            ;
        else if (msgFunction == 0x2)
        // Read-Broadcast-Distribution-Table
            ;
        else if (msgFunction == 0x3)
        // Not implemented because this does not send Read-Broadcast-Distribution-Table requests, and so should
        // not receive any responses.
            ;
        else if (msgFunction == 0x4)
        // Forwarded-NPDU.
        // If this was a BBMD, it could forward this message to its local broadcast address, meaning it could
        // receive its own forwards.
            ;
        else if (msgFunction == 0x5)
        // Register-Foreign-Device
            ;
        else if (msgFunction == 0x6)
        // Read-Foreign-Device-Table
            ;
        else if (msgFunction == 0x7)
        // Not implemented because this does not send Read-Foreign-Device-Table requests, and so should
        // not receive any responses.
            ;
        else if (msgFunction == 0x8)
        // Delete-Foreign-Device-Table-Entry
            ;
        else if (msgFunction == 0x9)
        // Distribute-Broadcast-To-Network
            ;
        */
        else if (msgFunction == 0xa)
        // Original-Unicast-NPDU
            msg = this.processNPDUData(queue, linkService);
        else if (msgFunction == 0xb) {
            // Original-Broadcast-NPDU
            // If we were BBMD, we would have to forward to foreign devices and other networks here.

            // just process locally
            msg = this.processNPDUData(queue, linkService);
        }
        else
            console.log('Unknown BVLC function type: 0x' + util.toHexStr(msgFunction, 2));


        if (msg == null)
            return;
    };

    // NL Protocol Data Unit (NPDU)
    BACnetIPNetwork.prototype.processNPDUData = function (queue, linkService) {
        var message = this.processNPCI(queue, linkService);

        if (message == null)
            return null;

        if (message.isNetworkMsg()) {
            switch (message.networkMsgType()) {
                case 0x1: // I-Am-Router-To-Network
                case 0x2: // I-Could-Be-Router-To-Network
                    // add network-router info to networkRouters array
                    while (queue.sizeAvailable(2)) {
                        var network = queue.readUInt16();
                        networkRouters[network.toString()].add(message.sourceAddress);
                    }
                    break;
                case 0x3: // Reject-Message-To-Network
                    var reason;
                    var reasonCode = queue.readUInt8();
                    if (reasonCode == 0)
                        reason = "Other error";
                    else if (reasonCode == 1)
                        reason = "The router is not directly connected to DNET and cannot find a router to DNET on any "
                            + "directly connected network using Who-Is-Router-To-Network messages.";
                    else if (reasonCode == 2)
                        reason = "The router is busy and unable to accept messages for the specified DNET at the "
                            + "present time.";
                    else if (reasonCode == 3)
                        reason = "It is an unknown network layer message type. The DNET returned in this case is a "
                            + "local matter.";
                    else if (reasonCode == 4)
                        reason = "The message is too long to be routed to this DNET.";
                    else if (reasonCode == 5)
                        reason = "The source message was rejected due to a BACnet security error and that error cannot "
                            + " be forwarded to the source device. See Clause 24.12.1.1 for more details on the "
                            + "generation of Reject-Message-To-Network messages indicating this reason.";
                    else if (reasonCode == 6)
                        reason = "The source message was rejected due to errors in the addressing. The length of the "
                            + "DADR or SADR was determined to be invalid.";
                    else
                        reason = "Unknown reason code";
                    console.log("Received Reject-Message-To-Network with reason '{}': {}", reasonCode, reason);
            }
        }

        return message;
    };

    // NL Protocol Control Information (NPCI)
    BACnetIPNetwork.prototype.processNPCI = function (queue, linkService) {
        // version must be 1
        var version = queue.readUInt();
        var control = queue.readUInt();

        var destinationNetwork = 0;
        var destinationAddress = 0;

        var sourceNetwork = 0;
        var sourceAddress = 0;

        var networkMsgType = null;
        var vendorId = null;

        if (util.isBitSet(control,5)) {
            destinationNetwork = queue.readUInt16();
            var destinationLength = queue.readUInt();

            if (destinationLength > 0) {
                destinationAddress = queue.readBytes(destinationLength);
            }
        }
        if (util.isBitSet(control,3)) {
            sourceNetwork = queue.readUInt16();
            var sourceLength = queue.readUInt();
            sourceAddress = queue.readBytes(sourceLength);
        }
        if (util.isBitSet(control,5)) {
            // do not need to do anything with it since we are no router
            var hopCount = queue.readUInt8();
        }
        if (util.isBitSet(control,7)) {
            // network message
            networkMsgType = queue.readUInt8();
        }

        // Check the destination network number and ignore foreign networks requests

        if (destinationNetwork > 0
            && destinationNetwork != this.ALL_NETWORKS
            && localNetworkNumber > 0
            && localNetworkNumber != destinationNetwork) {
            return null;
        }

        var msg = new Message(queue,
            sourceNetwork,
            sourceAddress,
            destinationNetwork,
            destinationAddress,
            networkMsgType,
            vendorId);

        if (util.isBitSet(control,7)) {
            msg.setIsNetworkMsg(true);
        }

        return msg;
    };

    BACnetIPNetwork.prototype.processADPUData = function(msg) {

        var adpu = adpusvc.createADPU(queue);
    };
}


