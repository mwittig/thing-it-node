
var EncodingService;
EncodingService = require('./encodingService.js');


var PrimitiveTypesService;
PrimitiveTypesService = require('./primitiveTypesService.js');



module.exports = {};

exports.confirmedRequestService = function (type, queue) {
    /**
     if (type == AcknowledgeAlarmRequest.TYPE_ID) // 0
     return new AcknowledgeAlarmRequest(queue);
     **/
    if (type == ConfirmedCovNotificationRequest.TYPE_ID) // 1
        return new ConfirmedCovNotificationRequest(queue);
    /**
     if (type == ConfirmedEventNotificationRequest.TYPE_ID) // 2
     return new ConfirmedEventNotificationRequest(queue);
     if (type == GetAlarmSummaryRequest.TYPE_ID) // 3
     return new GetAlarmSummaryRequest(queue);
     if (type == GetEnrollmentSummaryRequest.TYPE_ID) // 4
     return new GetEnrollmentSummaryRequest(queue);
     **/
    if (type == SubscribeCOVRequest.TYPE_ID) // 5
        return new SubscribeCOVRequest(queue);
    /**
     if (type == AtomicReadFileRequest.TYPE_ID) // 6
     return new AtomicReadFileRequest(queue);
     if (type == AtomicWriteFileRequest.TYPE_ID) // 7
     return new AtomicWriteFileRequest(queue);
     if (type == AddListElementRequest.TYPE_ID) // 8
     return new AddListElementRequest(queue);
     if (type == RemoveListElementRequest.TYPE_ID) // 9
     return new RemoveListElementRequest(queue);
     if (type == CreateObjectRequest.TYPE_ID) // 10
     return new CreateObjectRequest(queue);
     if (type == DeleteObjectRequest.TYPE_ID) // 11
     return new DeleteObjectRequest(queue);
     **/
    if (type == ReadPropertyRequest.TYPE_ID) // 12
        return new ReadPropertyRequest(queue);
    /**
     if (type == ReadPropertyMultipleRequest.TYPE_ID) // 14
     return new ReadPropertyMultipleRequest(queue);
     **/
    if (type == WritePropertyRequest.TYPE_ID) // 15
        return new WritePropertyRequest(queue);
    /**
     if (type == WritePropertyMultipleRequest.TYPE_ID) // 16
     return new WritePropertyMultipleRequest(queue);
     if (type == DeviceCommunicationControlRequest.TYPE_ID) // 17
     return new DeviceCommunicationControlRequest(queue);
     if (type == ConfirmedPrivateTransferRequest.TYPE_ID) // 18
     return new ConfirmedPrivateTransferRequest(queue);
     if (type == ConfirmedTextMessageRequest.TYPE_ID) // 19
     return new ConfirmedTextMessageRequest(queue);
     if (type == ReinitializeDeviceRequest.TYPE_ID) // 20
     return new ReinitializeDeviceRequest(queue);
     if (type == VtOpenRequest.TYPE_ID) // 21
     return new VtOpenRequest(queue);
     if (type == VtCloseRequest.TYPE_ID) // 22
     return new VtCloseRequest(queue);
     if (type == VtDataRequest.TYPE_ID) // 23
     return new VtDataRequest(queue);
     if (type == ReadRangeRequest.TYPE_ID) // 26
     return new ReadRangeRequest(queue);
     if (type == LifeSafetyOperationRequest.TYPE_ID) // 27
     return new LifeSafetyOperationRequest(queue);
     **/
    if (type == SubscribeCOVPropertyRequest.TYPE_ID) // 28
        return new SubscribeCOVPropertyRequest(queue);
    /**
     if (type == GetEventInformationRequest.TYPE_ID) // 29
     return new GetEventInformationRequest(queue);
     **/
    else
        console.log("Illegal or unimplemented Confirmed Request Type: "+type+"!!");
};


function ConfirmedRequestBaseService (queue) {
    this.typeId = null;

}

ReadPropertyRequest.prototype = new ConfirmedRequestBaseService();
ReadPropertyRequest.prototype.constructor = ReadPropertyRequest;
ReadPropertyRequest.prototype.parent = ConfirmedRequestBaseService.prototype;
function ReadPropertyRequest (queue) {
    this.typeId = 12;
};

ReadPropertyRequest.prototype.read = function (queue) {
    this.objectIdentifier = EncodingService.decodePrimitive(queue,"ObjectIdentifier",0);
    this.propertyIdentifier = EncodingService.decodePrimitive(queue,"Enumerated",1);

    this.propertyArrayIndex = EncodingService.decodePrimitiveOptional(queue,"UnsignedInteger",2)

    // TODO: ACHNNOWLEDGEMENT !!!
};


ReadPropertyRequest.prototype.write = function (queue) {
    this.objectIdentifier.write(queue,0);
    this.propertyIdentifier.write(queue,1);
    EncodingService.writeOptional(queue,this.propertyArrayIndex,2);
};

