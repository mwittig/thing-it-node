
var PrimitiveTypesService;
PrimitiveTypesService = require('./primitiveTypesService.js');

module.exports = {};

module.exports.writeOptional = function (queue, primitive, contextId) {
    if (primitive != null)
        primitive.write(queue, contextId);
};

module.exports.decodePrimitive = function (queue, primitiveTypeName, contextId) {
    if (!matchNonEndTag(queue, contextId)) {
        console.error("non matching context id!!");
        return null;
    }

    var primitiveT = PrimitiveTypesService.createPrimitive(queue);
    var primitiveTypeEnum = allEnumerations.PrimitiveTypes[primitiveT.getTypeId()];

    if (primitiveTypeEnum.getName != primitiveTypeName) {
        console.error("non matching context id!!");
        return null;
    }
    primitiveT.read(queue);

    return primitiveT;
};
module.exports.decodePrimitiveOptional = function (queue, primitiveTypeName, contextId) {
    if (!matchNonEndTag(queue, contextId)) {
        return null;
    }

    return decodePrimitive(queue, primitiveTypeName, contextId);
};
matchNonEndTag = function (queue, contextId) {
        return (queue.peekTagNumber() == contextId) && ((queue.peek(0) & 0xf) != 0xf);
};

