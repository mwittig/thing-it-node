/**
 * Created by backes on 15.01.17.
 */

'use strict';

module.exports = ByteQueue;

function ByteQueue(msgBuffer) {
    this.buffer = msgBuffer;
    this.pos = 0;

    this.dv = new DataView(msgBuffer);

    ByteQueue.prototype.getPos = function () {
        return this.pos;
    };

    ByteQueue.prototype.incPos = function (noOfBytes) {
        this.pos += noOfBytes;
    };

    ByteQueue.prototype.getBuffer = function () {
        return this.buffer;
    };

    ByteQueue.prototype.size = function () {
        return this.buffer.byteLength;
    };
    ByteQueue.prototype.sizeAvailable = function(sz, idx) {
        var arrayPos = this.pos;
        if (idx !== undefined) {
            arrayPos = idx;
        }
        if ((this.size - sz) > arrayPos)
            return true;
        else
            return false;
    }

    ByteQueue.prototype.readEnum = function (enumDef) {
        // next byte from queue, queue is actually an Int8-ArrayView on a Buffer
        var data = this.dv.getInt8(pos);

        this.incPos(1);

        // check for valid enumeratiuion value

        for (var enumVal in enumDef.elements) {
            if (data == 0 ||
                data == enumVal) {
                return data;
            }
        }
        // handle error
        console.error("unknown enumeration value: "+data);

        return 0;
    };
    ByteQueue.prototype.readUInt8 = function () {
        var sz = 1;
        if (!this.sizeAvailable(sz))
            return null;

        var data = this.dv.getUint8(pos);
        this.incPos(size);
        return data;
    };
    ByteQueue.prototype.readInt8 = function () {
        var sz = 1;
        if (!this.sizeAvailable(sz))
            return null;

        var data = this.dv.getInt8(pos);
        this.incPos(1)
        return data;
    };
    ByteQueue.prototype.readUInt16 = function () {
        var sz= 2;
        if (!this.sizeAvailable(sz))
            return null;

        var data = this.dv.getInt16(pos);
        this.incPos(size);
        return data;
    };
    ByteQueue.prototype.readInt16 = function () {
        var sz = 2;
        if (!this.sizeAvailable(sz))
            return null;

        var data = this.dv.getInt16(pos);
        this.incPos(size);
        return data;
    };
    ByteQueue.prototype.readUInt32 = function () {
        var sz = 4;
        if (!this.sizeAvailable(sz))
            return null;

        var data = this.dv.getUint32(pos);
        this.incPos(size);
        return data;
    };
    ByteQueue.prototype.readInt32 = function () {
        var sz = 4;
        if (!this.sizeAvailable(sz))
            return null;

        var data = this.dv.getInt32(pos);
        this.incPos(size);
        return data;
    };
    ByteQueue.prototype.readFloat32 = function () {
        var sz = 4;
        if (!this.sizeAvailable(sz))
            return null;

        var data = this.dv.getFloat32(pos);
        this.incPos(size);
        return data;
    }
    ByteQueue.prototype.readFloat64 = function () {
        var sz = 8;
        if (!this.sizeAvailable(sz))
            return null;

        var data = this.dv.getFloat64(pos);
        this.incPos(size);
        return data;
    }
    ByteQueue.prototype.readString = function (){
        // get encoding before reading
        // TODO
    };
    ByteQueue.prototype.readBytes = function (len, idx){
        var arrayPos = this.pos;
        if (idx !== undefined) {
            arrayPos = idx;
            if (!this.sizeAvailable(len, idx))
                return null;
        }
        else {
            if (!this.sizeAvailable(len))
                return null;
        }

        var data = new Uint8Array(this.buffer, arrayPos, len);

        if (idx === undefined) {
            this.incPos(len);
        }
        return data;
    };
    ByteQueue.prototype.copyRest = function() {
        this.buffer.slice(pos);
    };

    ByteQueue.prototype.push = function (value) {
        var sz = 1;
        this.dv.setInt8(this.pos, value);

        this.incPos(sz);
    }
    ByteQueue.prototype.writeInt8 = function (value) {
        var sz = 1;
        this.dv.setInt8(this.pos, value);

        this.incPos(sz);
    }
    ByteQueue.prototype.writeFloat32 = function (value) {
        var sz = 4;
        this.dv.setFloat32(this.pos, value);

        this.incPos(sz);
    }
    ByteQueue.prototype.writeFloat64 = function (value) {
        var sz = 8;
        this.dv.setFloat64(this.pos, value);

        this.incPos(sz);
    }
    ByteQueue.prototype.writeInt32 = function (value) {
        var sz = 4;
        this.dv.setInt32(this.pos, value);

        this.incPos(sz);
    }
    ByteQueue.prototype.writeBytes = function (uint8bytearray){
        var bytesItr =  uint8bytearray.entries();
        var b;
        while (b = bytesItr.next()) {
            this.writeInt8(b);
        }

        this.incPos(uint8bytearray.byteLength);
    };
}


