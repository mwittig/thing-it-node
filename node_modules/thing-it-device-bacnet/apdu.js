/**
 * Created by backes on 26.01.17.
 */


'use strict';


var ByteQueue;
ByteQueue = require('./byteQueue.js');

var confirmedRequestService;
confirmedRequestService = require('./confirmedRequestService.js');


module.exports = {};

exports.createAPDU = function (queue) {
    // Get the first byte. The 4 high-order bits will tell us the type of PDU this is.
    var type = msg.queue().readBytes(1,0);
    type = ((type & 0xff) >> 4);

    if (type == 0)
        return new ConfirmedRequest(queu);
        ;
    if (type == 1)
    // UnconfirmedRequest
        ;
    if (type == 2)
    // SimpleACK
        ;
    if (type == 3)
    // ComplexACK
        ;
    if (type == 4)
    // SegmentACK
        ;
    if (type == 5)
    // Error
        ;
    if (type == 6)
    // Reject
        ;
    if (type == 7)
        return new Abort(queue);


        console.log("Illegal (A)PDU Type: "+type+"!!");

}

function APDU (queue) {
    this.queue = queue;

    this.typeId = -1;

    APDU.prototype.write = function (queue) {
        consol.error('should not be called');
    };

    APDU.prototype.expectsReply = function () {
        return false;
    };

    APDU.prototype.getShiftedTypeId = function () {
        return typeId << 4;
    };

    APDU.prototype.getPduType = function () {
        return this.TYPE_ID;
    };


}

AckAPDU.prototype = new APDU();
AckAPDU.prototype.constructor = AckAPDU;
AckAPDU.prototype.parent = APDU.prototype;
function AckAPDU (queue) {
    this.parent.queue = queue;

    /**
     * This parameter shall be the 'invokeID' contained in the confirmed service request being acknowledged. The same
     * 'originalinvokeID' shall be used for all segments of a segmented acknowledgment.
     */
    this.originalInvokeId = -1;

    AckAPDU.prototype.getOriginalInvokeId = function () {
        return this.originalInvokeId;
    };

    AckAPDU.prototype.isServer = function () {
        return true;
    };
}

Segmentable.prototype = new APDU ();
Segment.prototype.constructor = Segmentable;
Segment.prototype.parent = APDU.prototype;
function Segmentable (queue) {
    this.parent.queue = queue;

    var segmentedMessage = false;
    var mordeFollows = false;


    /**
     * This parameter indicates whether or not the confirmed service request is entirely, or only partially, contained
     * in the present PDU. If the request is present in its entirety, the value of the 'segmented-message' parameter
     * shall be FALSE. If the present PDU contains only a segment of the request, this parameter shall be TRUE.
     */
    this.segmentedMessage = false;

    /**
     * This parameter is only meaningful if the 'segmented-message' parameter is TRUE. If 'segmented-message' is TRUE,
     * then the 'more-follows' parameter shall be TRUE for all segments comprising the confirmed service request except
     * for the last and shall be FALSE for the final segment. If 'segmented-message' is FALSE, then 'more-follows' shall
     * be set FALSE by the encoder and shall be ignored by the decoder.
     */
    this.moreFollows = false;

    /**
     * This parameter shall be TRUE if the device issuing the confirmed request will accept a segmented complex
     * acknowledgment as a response. It shall be FALSE otherwise. This parameter is included in the confirmed request so
     * that the responding device may determine how to convey its response.
     */
    this.segmentedResponseAccepted = false;

    /**
     * This optional parameter specifies the maximum number of segments that the device will accept. This parameter is
     * included in the confirmed request so that the responding device may determine how to convey its response. The
     * parameter shall be encoded as follows: B'000' Unspecified number of segments accepted. B'001' 2 segments
     * accepted. B'010' 4 segments accepted. B'011' 8 segments accepted. B'100' 16 segments accepted. B'101' 32 segments
     * accepted. B'110' 64 segments accepted. B'111' Greater than 64 segments accepted.
     */
    this.maxSegmentsAccepted = allEnumerations.MaxSegments[0];

    /**
     * This parameter specifies the maximum size of a single APDU that the issuing device will accept. This parameter is
     * included in the confirmed request so that the responding device may determine how to convey its response. The
     * parameter shall be encoded as follows: B'0000' Up to MinimumMessageSize (50 octets) B'0001' Up to 128 octets
     * B'0010' Up to 206 octets (fits in a LonTalk frame) B'0011' Up to 480 octets (fits in an ARCNET frame) B'0100' Up
     * to 1024 octets B'0101' Up to 1476 octets (fits in an ISO 8802-3 frame) B'0110' reserved by ASHRAE B'0111'
     * reserved by ASHRAE B'1000' reserved by ASHRAE B'1001' reserved by ASHRAE B'1010' reserved by ASHRAE B'1011'
     * reserved by ASHRAE B'1100' reserved by ASHRAE B'1101' reserved by ASHRAE B'1110' reserved by ASHRAE B'1111'
     * reserved by ASHRAE
     */
    this.maxApduLengthAccepted = allEnumerations.maxApduLengthAccepted[5];

    /**
     * This parameter shall be an integer in the range 0 - 255 assigned by the service requester. It shall be used to
     * associate the response to a confirmed service request with the original request. In the absence of any error, the
     * 'invokeID' shall be returned by the service provider in a BACnet-SimpleACK-PDU or a BACnet-ComplexACK-PDU. In the
     * event of an error condition, the 'invokeID' shall be returned by the service provider in a BACnet-Error-PDU,
     * BACnet-Reject-PDU, or BACnet-Abort-PDU as appropriate.
     *
     * The 'invokeID' shall be generated by the device issuing the service request. It shall be unique for all
     * outstanding confirmed request APDUs generated by the device. The same 'invokeID' shall be used for all segments
     * of a segmented service request. Once an 'invokeID' has been assigned to an APDU, it shall be maintained within
     * the device until either a response APDU is received with the same 'invokeID' or a no response timer expires (see
     * 5.3). In either case, the 'invokeID' value shall then be released for reassignment. The algorithm used to pick a
     * value out of the set of unused values is a local matter. The storage mechanism for maintaining the used
     * 'invokeID' values within the requesting and responding devices is also a local matter. The requesting device may
     * use a single 'invokeID' space for all its confirmed APDUs or multiple 'invokeID' spaces (one per destination
     * device address) as desired. Since the 'invokeID' values are only source-device-unique, the responding device
     * shall maintain the 'invokeID' as well as the requesting device address until a response has been sent. The
     * responding device may discard the 'invokeID' information after a response has been sent.
     */
    this.invokeId = null;

    /**
     * This optional parameter is only present if the 'segmented-message' parameter is TRUE. In this case, the
     * 'sequence-number' shall be a sequentially incremented unsigned integer, modulo 256, which identifies each segment
     * of a segmented request. The value of the received 'sequence-number' is used by the responder to acknowledge the
     * receipt of one or more segments of a segmented request. The 'sequence-number' of the first segment of a segmented
     * request shall be zero.
     */
    this.sequenceNumber = 0;

    /**
     * This optional parameter is only present if the 'segmented-message' parameter is TRUE. In this case, the
     * 'proposed-windowsize' parameter shall specify as an unsigned binary integer the maximum number of message
     * segments containing 'invokeID' the sender is able or willing to send before waiting for a segment acknowledgment
     * PDU (see 5.2 and 5.3). The value of the 'proposed-window-size' shall be in the range 1 - 127.
     */
    this.proposedWindowSize = null;



    Segmentable.prototype.getInvokeId = function () {
        return this.invokeId;
    };

    Segmentable.prototype.isSegmentedMessage = function () {
        return this.segmentedMessage;
    };

    Segmentable.prototype.isMoreFollows = function () {
        return this.moreFollows;
    };

    Segmentable.prototype.getSequenceNumber = function () {
        return this.sequenceNumber;
    };

    Segmentable.prototype.getProposedWindowSize = function() {
        return this.proposedWindowSize;
    };

    Segmentable.prototype.appendServiceData(queue);

    Segmentable.prototype.parseServiceData();
}


ConfirmedRequest.prototype = new Segmentable();
ConfirmedRequest.prototype.constructor = ConfirmedRequest;
ConfirmedRequest.prototype.parent = Segmentable.prototype;
function ConfirmedRequest (queue) {
    var b = queue.readUInt8();
    this.typeId = 0;

    this.segmentedMessage = (b & 8) != 0;
    this.moreFollows = (b & 4) != 0;
    this.segmentedResponseAccepted = (b & 2) != 0;

    b = queue.readUInt8();
    this.maxSegmentsAccepted = allEnumerations.MaxSegments[((b & 0x70) >> 4)].getId();
    this.maxApduLengthAccepted = allEnumerations.MaxApduLength[(b & 0xf)].getId();
    this.invokeId = queue.readUInt8();
    if (segmentedMessage) {
        this.sequenceNumber = queue.readUInt8();
        this.proposedWindowSize = queue.readUInt8();
    }
    this.serviceChoice = queue.readInt8();
    this.serviceData = new ByteQueue(queue.copyRest());
    // This is called due to an incoming request, so setting to null here should be ok.
    this.networkPriority = null;


    /**
     * This parameter shall contain the parameters of the specific service that is being requested, encoded according to
     * the rules of 20.2. These parameters are defined in the individual service descriptions in this standard and are
     * represented in Clause 21 in accordance with the rules of ASN.1.
     */
    this.serviceChoice = null;
    this.serviceRequest = null;

    /**
     * This field is used to allow parsing of only the APDU so that those fields are available in case there is a
     * problem parsing the service request.
     */
    this.serviceData = null;

    this.networkPriority = null;


    ConfirmedRequest.prototype.create = function (segmentedMessage, moreFollows, segmentedResponseAccepted,
        maxSegmentsAccepted, maxApduLengthAccepted, invokeId, sequenceNumber,
        proposedWindowSize, serviceChoice, serviceData, networkPriority) {

        var request = new ConfirmedRequest(serviceData);

        request.segmentedMessage = segmentedMessage;
        request.moreFollows = moreFollows;
        request.segmentedResponseAccepted = segmentedResponseAccepted;
        request.maxSegmentsAccepted = maxSegmentsAccepted;
        request.maxApduLengthAccepted = maxApduLengthAccepted;
        request.invokeId = invokeId;
        request.sequenceNumber = sequenceNumber;
        request.proposedWindowSize = proposedWindowSize;
        request.serviceChoice = serviceChoice;


        request.networkPriority = networkPriority;

        return request;
    }


    ConfirmedRequest.prototype.getServiceRequest = function () {
        return this.serviceRequest;
    };

    ConfirmedRequest.prototype.appendServiceData = function (serviceData) {
        this.serviceData.push(serviceData);
    };

    ConfirmedRequest.prototype.getServiceData = function () {
        return serviceData;
    };

    ConfirmedRequest.prototype.getServiceChoice = function () {
        return serviceChoice;
    };

    ConfirmedRequest.prototype.getNetworkPriority = function () {
        return networkPriority;
    };

    ConfirmedRequest.prototype.write = function (queue) {
        queue.push(getShiftedTypeId(TYPE_ID) | (segmentedMessage ? 8 : 0) | (moreFollows ? 4 : 0)
            | (segmentedResponseAccepted ? 2 : 0));
        queue.push(((maxSegmentsAccepted.getId() & 7) << 4) | (maxApduLengthAccepted.getId() & 0xf));
        queue.push(invokeId);
        if (segmentedMessage) {
            queue.push(sequenceNumber);
            queue.push(proposedWindowSize);
        }
        queue.push(serviceChoice);
        if (serviceRequest != null)
            serviceRequest.write(queue);
        else
            queue.push(serviceData);
    };

    ConfirmedRequest.prototype.parseServiceData = function () {
        if (serviceData != null) {
            this.serviceRequest = confirmedRequestService(serviceChoice, serviceData);
            this.serviceData = null;
        }
    };


    ConfirmedRequest.prototype.toString = function () {
        return "ConfirmedRequest(segmentedMessage=" + segmentedMessage + ", moreFollows=" + moreFollows
            + ", segmentedResponseAccepted=" + segmentedResponseAccepted + ", maxSegmentsAccepted="
            + maxSegmentsAccepted + ", maxApduLengthAccepted=" + maxApduLengthAccepted + ", invokeId=" + invokeId
            + ", sequenceNumber=" + sequenceNumber + ", proposedWindowSize=" + proposedWindowSize
            + ", serviceChoice=" + serviceChoice + ", serviceRequest=" + serviceRequest + ")";
    };


    ConfirmedRequest.prototype.expectsReply = function () {
        return true;
    };

}




/**
 * The BACnet-Abort-PDU is used to terminate a transaction between two peers.
 *
 */
Abort.prototype = new AckAPDU();
Abort.prototype.constructor = Abort;
Abort.prototype.parent = AckAPDU.prototype;
function Abort (queue) {
    this.parent.parent.typeId = 7;

    /**
     * This parameter shall be TRUE when the Abort PDU is sent by a server. This parameter shall be FALSE when the Abort
     * PDU is sent by a client.
     */
    this.is_server = false;

    /**
     * This parameter, of type BACnetAbortReason, contains the reason the transaction with the indicated invoke ID is
     * being aborted.
     */
    this.abortReason = 0;

    this.is_server = (queue.readUInt8() & 1) == 1;
    this.parent.originalInvokeId = queue.readUInt8();
    this.abortReason = queue.readUInt8();


    Abort.prototype.isServer = function () {
        return this.is_server;
    };

    Abort.prototype.getAbortReason = function () {
        return this.abortReason;
    };

    Abort.prototype.write = function (queue) {
        var data = getShiftedTypeId() | (this.is_server ? 1 : 0);
        queue.push(data);
        queue.push(this.originalInvokeId);
        queue.push(this.abortReason);
    };

    Abort.prototype.expectsReply = function () {
        return false;
    };
}
