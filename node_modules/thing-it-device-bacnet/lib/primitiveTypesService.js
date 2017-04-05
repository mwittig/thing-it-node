
'use strict';


var ByteQueue;
ByteQueue = require('./byteQueue.js');

module.exports = {};

exports.primitiveTypesService = function (typeId, queue) {
    if (typeId == NULLT.typeId) // 1
        return new NULLT(queue);
    if (typeId == BooleanT.typeId) // 1
        return new BooleanT(queue);
    if (typeId == UnsignedIntegerT.typeId) // 1
        return new UnsignedIntegerT(queue);
    if (typeId == SignedIntegerT.typeId) // 1
        return new SignedIntegerT(queue);
    if (typeId == RealT.typeId) // 1
        return new RealT(queue);
    if (typeId == DoubleT.typeId) // 1
        return new DoubleT(queue);
    if (typeId == OctetStringT.typeId) // 1
        return new OctetStringT(queue);
    /*
     if (type == CharacterStringT.typeId) // 1
     return new CharacterStringT(queue);
     if (type == BitStringT.typeId) // 1
     return new BitStringT(queue);
     */
     if (typeId == EnumeratedT.typeId) // 1
     return new EnumeratedT(queue);
     /*
     if (type == DateT.typeId) // 1
     return new DateT(queue);
     if (type == TimeT.typeId) // 1
     return new TimeT(queue);
     */
    if (typeId == ObjectIdentifierT.typeId) // 1
        return new ObjectIdentifierT(queue);
    else
        console.log("Illegal or unimplemented Primitive BACnet Type: "+typeId+"!!");
};

exports.isPrimitiveType = function (typeiD) {
    if (typeiD == NULLT.typeId ||
        typeiD == BooleanT.typeId ||
        typeiD == UnsignedIntegerT.typeId ||
        typeiD == SignedIntegerT.typeId ||
        typeiD == RealT.typeId ||
        typeiD == DoubleT.typeId ||
        typeiD == OctetStringT.typeId ||
        typeiD == CharacterStringT.typeId ||
        typeiD == BitStringT.typeId ||
        typeiD == EnumeratedT.typeId ||
        typeiD == DateT.typeId  ||
        typeiD == TimeT.typeId ||
        typeiD == ObjectIdentifierT.typeId) {
        return true;
    }
    else {
        return false;
    }

    exports.createPrimitive = function (queue) {
        // Get the first byte. The 4 high-order bits will tell us what the data type is.
        var type = queue.peek(0);
        type = ((type & 0xff) >> 4);

        return primitiveTypesService (type, queue);
    };

    exports.createPrimitive = function (queue, contextId, typeiD)  {
        var tagNumber = queue.peekTagNumber();

        // Check if the tag number matches the context id. If they match, then create the context-specific parameter,
        // otherwise return null.
        if (tagNumber != contextId)
            return null;

        return primitiveTypesService (typeiD, queue);
    };
};


function PrimitiveT (queue) {
    this.queue = queue;

    this.typeId = null;

    /**
     * This field is maintained specifically for boolean types, since their encoding differs depending on whether the
     * type is context specific or not.
     */
    this.contextSpecific = false;


    PrimitiveT.prototype.write = function (queue, contextId) {
        if (contextId == undefined) {
            this.writeTag(queue, getTypeId(), false, getLength());
            writeImpl(queue);
        }
        else {
            this.contextSpecific = true;
            this.writeTag(queue, contextId, true, getLength());
            this.writeImpl(queue);
        }
    };

    PrimitiveT.prototype.writeEncodable = function (queue, contextId) {
        this.writeContextTag(queue, contextId, true);
        this.write(queue);
        this.writeContextTag(queue, contextId, false);
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
    this.typeId = allEnumerations.PrimitiveTypes[0].getId();
    this.value = null;

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
    this.typeId = allEnumerations.PrimitiveTypes[1].getId();
    this.value = null; // boolean

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
    this.typeId = allEnumerations.PrimitiveTypes[2].getId();
    this.value = null;

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



EnumeratedT.prototype = new UnsignedIntegerT();
EnumeratedT.prototype.constructor = EnumeratedT;
EnumeratedT.prototype.parent = UnsignedIntegerT.prototype;
function EnumeratedT (queue) {
    this.queue = queue;
    this.typeId = allEnumerations.PrimitiveTypes[9].getId();
    this.value = null;

    parent.prototype.

    EnumeratedT.prototype.writeImpl = function (queue) {
        parent.prototype.writeImpl(queue);
    };
    EnumeratedT.prototype.getLength = function () {
        return parent.prototype.getLength();
    };
};



SignedIntegerT.prototype = new PrimitiveT();
SignedIntegerT.prototype.constructor = SignedIntegerT;
SignedIntegerT.prototype.parent = PrimitiveT.prototype;
function SignedIntegerT (queue) {
    this.queue = queue;
    this.typeId = allEnumerations.PrimitiveTypes[3].getId();
    this.value = null;


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
    this.typeId = allEnumerations.PrimitiveTypes[4].getId();
    this.value = null;


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
    this.typeId = allEnumerations.PrimitiveTypes[5].getId();
    this.value = null;


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
    this.typeId = allEnumerations.PrimitiveTypes[6].getId();
    this.value = null;


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



ObjectIdentifierT.prototype = new PrimitiveT();
ObjectIdentifierT.prototype.constructor = ObjectIdentifierT;
ObjectIdentifierT.prototype.parent = PrimitiveT.prototype;
function ObjectIdentifierT (queue) {
    this.queue = queue;
    this.typeId = allEnumerations.PrimitiveTypes[12].getId();
    this.value = null;

    readTag(queue);

    var objectType = queue.readUint8() << 2;
    var i = queue.readUInt8();
    objectType |= i >> 6;

    this.objectType = allEnumerations.ObjectType[objectType];

    this.instanceNumber = (i & 0x3f) << 16;
    this.instanceNumber |= queue.readUInt8() << 8;
    this.instanceNumber |= queue.readUInt8();

    ObjectIdentifierT.prototype.writeImpl = function (queue) {
        var objectTypeId = this.objectType.getId();

        queue.push(objectTypeId >> 2);
        queue.push(((objectTypeId & 3) << 6) | (this.instanceNumber >> 16));
        queue.push(this.instanceNumber >> 8);
        queue.push(this.instanceNumber);
    };
    ObjectIdentifierT.prototype.getLength = function () {
        return 4;
    };
}