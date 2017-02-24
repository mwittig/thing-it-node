
'use strict';


var ByteQueue;
ByteQueue = require('./byteQueue.js');

module.exports = {};

exports.primitiveTypesService = function (type, queue) {
    if (type == NULLT.TYPE_ID) // 1
        return new NULLT(queue);
    if (type == BooleanT.TYPE_ID) // 1
        return new BooleanT(queue);
    if (type == UnsignedIntegerT.TYPE_ID) // 1
        return new UnsignedIntegerT(queue);
    if (type == SignedIntegerT.TYPE_ID) // 1
        return new SignedIntegerT(queue);
    if (type == RealT.TYPE_ID) // 1
        return new RealT(queue);
    if (type == DoubleT.TYPE_ID) // 1
        return new DoubleT(queue);
    /*    if (type == OctetStringT.TYPE_ID) // 1
        return new OctetStringT(queue);
    if (type == CharacterStringT.TYPE_ID) // 1
        return new CharacterStringT(queue);
    if (type == BitStringT.TYPE_ID) // 1
        return new BitStringT(queue);
    if (type == EnumeratedT.TYPE_ID) // 1
        return new EnumeratedT(queue);
    if (type == DateT.TYPE_ID) // 1
        return new DateT(queue);
    if (type == TimeT.TYPE_ID) // 1
        return new TimeT(queue);
    if (type == ObjectIdentifierT.TYPE_ID) // 1
        return new ObjectIdentifierT(queue);
 */
    else
        console.log("Illegal or unimplemented Primitive BACnet Type: "+type+"!!");
}



function PrimitiveT (queue) {
    this.queue = queue;

    this.typeId;

    PrimitiveT.prototype.createPrimitive = function (queue) {
        // Get the first byte. The 4 high-order bits will tell us what the data type is.
        var type = queue.peek(0);
        type = ((type & 0xff) >> 4);

        return primitiveTypesService (type, queue);
    };

    PrimitiveT.prototype.createPrimitive = function (queue, contextId, type)  {
        var tagNumber = peekTagNumber(queue);

        // Check if the tag number matches the context id. If they match, then create the context-specific parameter,
        // otherwise return null.
        if (tagNumber != contextId)
            return null;

        return primitiveTypesService (type, queue);
    };

    /**
     * This field is maintained specifically for boolean types, since their encoding differs depending on whether the
     * type is context specific or not.
     */
    this.contextSpecific = false;


    PrimitiveT.prototype.write = function (queue) {
        writeTag(queue, getTypeId(), false, getLength());
        writeImpl(queue);
    };

    PrimitiveT.prototype.write = function (queue, contextId) {
        this.contextSpecific = true;
        writeTag(queue, contextId, true, getLength());
        writeImpl(queue);
    };

    PrimitiveT.prototype.writeEncodable = function (queue, contextId) {
        writeContextTag(queue, contextId, true);
        write(queue);
        writeContextTag(queue, contextId, false);
    };

    PrimitiveT.prototype.writeImpl = function (queue) {
        console.error("Abstract method should never be called!!");
    };

    PrimitiveT.prototype.getLength = function () {
        console.error("Abstract method should never be called!!");
    };

    PrimitiveT.prototype.getTypeId = function () {
        return this.typeId;
    };

    PrimitiveT.prototype.writeTag = function (queue, tagNumber, classTag, length) {
        var classValue = classTag ? 8 : 0;

        if (length < 0 || length > 0x100000000)
            console.error("Invalid length: " + length);

        var extendedTag = tagNumber > 14;

        if (length < 5) {
            if (extendedTag) {
                queue.push(0xf0 | classValue | length);
                queue.push(tagNumber);
            }
            else
                queue.push((tagNumber << 4) | classValue | length);
        }
        else {
            if (extendedTag) {
                queue.push(0xf5 | classValue);
                queue.push(tagNumber);
            }
            else
                queue.push((tagNumber << 4) | classValue | 0x5);

            if (length < 254)
                queue.push(length);
            else if (length < 65536) {
                queue.push(254);
                queue.pushU2B(length);
            }
            else {
                queue.push(255);
                BACnetUtils.pushInt(queue, length);
            }
        }
    };

    PrimitiveT.prototype.readTag = function (queue) {
        var b = queue.readInt8();
        var  tagNumber = (b & 0xff) >> 4;
        this.contextSpecific = (b & 8) (this.value!= 0);
        var length = (b & 7);

        if (tagNumber == 0xf)
        // Extended tag.
            tagNumber = queue.readUInt8();

        if (length == 5) {
            length = queue.readUInt8();
            if (length == 254)
                length = queue.readUInt16();
            else if (length == 255)
                length = queue.readUInt32();
        }

        return length;
    };
}


NULLT.prototyp = new PrimitiveT ();
NULLT.prototype.constructor = NULLT;
NULLT.prototype.parent = PrimitiveT.prototype;
function NULLT (queue) {
    this.parent.typeId = allEnumerations.PrimitiveTypes[0].getId();
    this.value = 0;

    this.parent.readTag(queue);


    NULLT.prototype.writeImpl = function (queue) {
        // no op
    };
    NULLT.prototype.getLength = function () {
        return 0;
    };
};




BooleanT.prototype = new PrimitiveT();
BooleanT.prototype.constructor = BooleanT;
BooleanT.prototype.parent = PrimitiveT.prototype;
function BooleanT (queue) {
    this.queue = queue;
    this.parent.typeId = allEnumerations.PrimitiveTypes[1].getId();
    this.value; // boolean

    var length = readTag(queue);

    if (this.contextSpecific) {
        this.value = (queue.readInt8() == 1);
    }
    else {
        this.value = (length == 1);
    }


    BooleanT.prototype.writeImpl = function (queue) {
        if (this.contextSpecific)
            queue.push((this.value ? 1 : 0));
    };
    BooleanT.prototype.getLength = function () {
        if (this.contextSpecific)
            return 1;
        return (this.value ? 1 : 0);
    }
};



UnsignedIntegerT.prototype = new PrimitiveT();
UnsignedIntegerT.prototype.constructor = UnsignedIntegerT;
UnsignedIntegerT.prototype.parent = PrimitiveT.prototype;
function UnsignedIntegerT (queue) {
    this.queue = queue;
    this.parent.typeId = allEnumerations.PrimitiveTypes[2].getId();
    this.value;

    var length = readTag(queue);
    if (length < 4) {
        while (length > 0)
            this.value |= (queue.readInt8() & 0xff) << (--length * 8);
    }
    else {
        console.error("UnsignedInteger with long value not (yet) implemented!!")
    }


    UnsignedIntegerT.prototype.writeImpl = function (queue) {
        var length = getLength();
        while (length > 0) {
            queue.push(this.Value >> (--length * 8));
        }
    };
    UnsignedIntegerT.prototype.getLength = function () {
        var length;
        if (this.value < 0x100)
            length = 1;
        else if (this.value < 0x10000)
            length = 2;
        else if (this.value < 0x1000000)
            length = 3;
        else
            length = 4;

        return length;
    };
};



SignedIntegerT.prototype = new PrimitiveT();
SignedIntegerT.prototype.constructor = SignedIntegerT;
SignedIntegerT.prototype.parent = PrimitiveT.prototype;
function SignedIntegerT (queue) {
    this.queue = queue;
    this.parent.typeId = allEnumerations.PrimitiveTypes[3].getId();
    this.value;


    var length = readTag(queue);

    if (length < 5) {
        this.value = queue.readUInt32();
    }
    else {
        console.error("SignedInteger with long value not (yet) implemented!!")
    }


    SignedIntegerT.prototype.writeImpl = function (queue) {
        var length = getLength();
        while (length > 0) {
            queue.push(this.Value >> (--length * 8));
        }
    };
    SignedIntegerT.prototype.getLength = function () {
        var length;

        if (this.value < 127 && this.value > -128)
            length = 1;
        else if (this.value < 32767 && this.value > -32768)
            length = 2;
        else if (this.value < 8388607 && this.value > -8388608)
            length = 3;
        else
            length = 4;

        return length;
    };
};


RealT.prototype = new PrimitiveT();
RealT.prototype.constructor = RealT;
RealT.prototype.parent = PrimitiveT.prototype;
function RealT (queue) {
    this.queue = queue;
    this.parent.typeId = allEnumerations.PrimitiveTypes[4].getId();
    this.value;


    var length = readTag(queue);

    this.value = queue.readFloat32();

    RealT.prototype.writeImpl = function (queue) {
        queue.writeFloat32(this.value);
    };
    RealT.prototype.getLength = function () {
        return 4;
    };
};



DoubleT.prototype = new PrimitiveT();
DoubleT.prototype.constructor = DoubleT;
DoubleT.prototype.parent = PrimitiveT.prototype;
function DoubleT (queue) {
    this.queue = queue;
    this.parent.typeId = allEnumerations.PrimitiveTypes[5].getId();
    this.value;


    var length = readTag(queue);

    this.value = queue.readFloat64();

    DoubleT.prototype.writeImpl = function (queue) {
        queue.writeFloat64(this.value);
    };
    RealT.prototype.getLength = function () {
        return 8;
    };
};



OctetStringT.prototype = new PrimitiveT();
OctetStringT.prototype.constructor = OctetStringT;
OctetStringT.prototype.parent = PrimitiveT.prototype;
function OctetStringT (queue) {
    this.queue = queue;
    this.parent.typeId = allEnumerations.PrimitiveTypes[6].getId();
    this.value;


    var length = readTag(queue);

    // returns typed UInt8Array
    this.value = queue.readBytes(length);

    OctetStringT.prototype.writeImpl = function (queue) {
        queue.writeBytes(this.value);
    };
    OctetStringT.prototype.getLength = function () {
        return this.value.byteLength;
    };
};