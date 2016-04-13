module.exports = {
    hasSuffix: hasSuffix,
    inheritMethods: inheritMethods,
    cloneFiltered: cloneFiltered,
    cloneDeep: cloneDeep,
    promiseSequence: promiseSequence,
    getNextIdIndex: getNextIdIndex,
    getNextDefaultId: getNextDefaultId,
    getNextDefaultLabel: getNextDefaultLabel,
    getPackageInfo: getPackageInfo,
    removeItemFromArray: removeItemFromArray
};

var q = require('q');
var _ = require('lodash');
var fs = require('fs');
var path = require('path');

function inheritMethods(target, source) {
    for (var member in source) {
        if (source[member] instanceof Function) {
            target[member] = source[member];
        }
    }
}

/**
 *
 */
function cloneFiltered(object) {
    if (!object) {
        return null;
    }

    var clone = _.cloneDeep(object, function (value, key, object) {
        // Nullify all members starting with "_" or "__"

        if (key && _.isString(key) && key.indexOf("_") == 0) {
            return null;
        }

        return undefined;
    });

    return clone;
}

/**
 *
 */
function cloneDeep(object) {
    return cloneFiltered(object);
}

/**
 *
 * @param list
 * @param index
 * @param method
 * @returns
 */
function promiseSequence(list, index, method) {
    var deferred = q.defer();

    if (!list || !list.length || index == list.length) {
        deferred.resolve();
    } else {
        try {
            list[index][method]
            ()
                .then(
                function () {
                    promiseSequence(list, index + 1, method)
                        .then(function () {
                            deferred.resolve();
                        })
                        .fail(
                        function (error) {
                            console
                                .error("Failed promise sequence continuation "
                                + (index + 1)
                                + ":"
                                + error);

                            deferred.reject(error);
                        });
                })
                .fail(
                function (error) {
                    console
                        .error("Failed promise sequence for element "
                        + index + ": " + error);
                    console.error(list[index]);

                    deferred.reject(error);
                });
        } catch (error) {
            console.error("Failed execution of " + method + ": " + error);
            console.error(list[index]);

            deferred.reject(error);
        }
    }

    return deferred.promise;
}

/**
 *
 */
function getNextIdIndex(list, baseId, index) {
    for (var n = 0; n < list.length; ++n) {
        if (list[n].id == baseId + index) {
            return getNextIdIndex(list, baseId, ++index);
        }
    }

    return index;
}

/**
 *
 */
function getNextDefaultId(list, id, index) {
    if (list) {
        for (var n = 0; n < list.length; ++n) {
            if (list[n].id == id + index) {
                return getNextDefaultId(list, id, ++index);
            }
        }
    }

    return id + index;
}

/**
 *
 */
function getNextDefaultLabel(list, label, index) {
    if (list) {
        for (var n = 0; n < list.length; ++n) {
            if (list[n].label == label + " " + index) {
                return getNextDefaultLabel(list, label, ++index);
            }
        }
    }

    return label + " " + index;
}

/**
 *
 * @param string
 * @param suffix
 * @returns {boolean}
 */
function hasSuffix(string, suffix) {
    return string.indexOf(suffix, string.length - suffix.length) !== -1;
}

/**
 *
 * @param module
 * @returns {*}
 */
function getPackageInfo(module) {
    return require(path.dirname(require.resolve(module)) + "/package");
}

/**
 *
 * @param item
 */
function removeItemFromArray(array, item) {
    var n = 0;

    while (n < array.length) {
        if (array[n] == item) {
            removeFromArray(array, n, n);
            // incase duplicates are present array size decreases,
            // so again checking with same index position
            continue;
        }

        ++n;
    }
}

/**
 *
 * @param array
 * @param from
 * @param to
 * @returns {*|Number}
 */
function removeFromArray(array, from, to) {
    var rest = array.slice((to || from) + 1 || array.length);
    array.length = from < 0 ? array.length + from : from;
    return array.push.apply(array, rest);
}