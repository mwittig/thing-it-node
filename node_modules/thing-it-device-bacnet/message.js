/**
 * Created by backes on 15.01.17.
 */

'use strict';

module.exports = Message;

function Message (queue,
                    sourceNetwork,
                    sourceAddress,
                    destinationNetwork,
                    destinationAddress,
                    networkMsgType,
                    vendorId) {
    this.queue = queue;

    this.sourceNetwork = sourceNetwork;
    this.sourceAddress = sourceAddress;

    this.destinationNetwork = destinationNetwork;
    this.destinationAddress = destinationAddress;
    this.networkMsgType = networkMsgType;
    this.vendorId = vendorId;

    this.isNetworkMsg = true;
}

Message.prototype.setIsNetworkMsg = function (bool) {
    this.isNetworkMsg = bool;
}

Message.prototype.isNetworkMsg = function () {
    return this.isNetworkMsg;
}

Message.prototype.networkMsgType = function () {
    if (!this.isNetworkMsg())
        return null;
    return this.networkMsgType;
}

Message.prototype.sourceAddress = function () {
    return this.sourceAddress;
}

Message.prototype.sourceAddress = function () {
    return this.sourceAddress;
}

Message.prototype.queue = function () {
    return this.queue;
}