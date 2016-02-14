var _ = require("lodash");

/**
 *
 */
function cloneFiltered(object) {
    if (!object) {
        return null;
    }

    var clone = _.cloneDeep(object, function (value, key, object) {
        console.log("value = ", value);
        console.log("key = ", key);

        // Nullify all members starting with "_" or "__"

        if (key && _.isString(key) && key.indexOf("__") == 0) {
            return null;
        }

        return undefined;
    });

    return clone;
}

var x = {a: 17, b: "willi", __b: "Nase"};

var y = {r: 18, t: x, s: x, __s: x};

y.rec = y;

var z = cloneFiltered(y);

console.log("z = ", z);