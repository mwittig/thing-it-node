module.exports = {
	hasSuffix: hasSuffix,
	inheritMethods : inheritMethods,
	cloneFiltered : cloneFiltered,
	promiseSequence : promiseSequence,
    getNextIdIndex : getNextIdIndex
};

var q = require('q');
var lodash = require('lodash');

function inheritMethods(target, source) {
	for ( var member in source) {
		if (source[member] instanceof Function) {
			target[member] = source[member];
		}
	}
}

/**
 * 
 */
function cloneFiltered(object, filter) {
	var clone = lodash.cloneDeep(object);

	// Traverse and delete all filtered
	// TODO Check whether strip can be done in lodash callback

	stripFields(clone, filter);

	return clone;
}

/**
 * 
 * @param object
 * @param filter
 */
function stripFields(object, filter) {
	if (typeof (object) !== "object") {
		return;
	}

	for ( var key in object) {
		if (!object.hasOwnProperty(key)) {
			continue;
		}

		if (key.search(filter) == 0) {
			delete object[key];

			continue;
		}

		stripFields(object[key], filter);
	}
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
							function() {
								promiseSequence(list, index + 1, method)
										.then(function() {
											deferred.resolve();
										})
										.fail(
												function(error) {
													console
															.error("Failed promise sequence continuation "
																	+ (index + 1)
																	+ ":"
																	+ error);

													deferred.reject(error);
												});
							})
					.fail(
							function(error) {
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
 * @param string
 * @param suffix
 * @returns {boolean}
 */
function hasSuffix(string, suffix)
{
	return string.indexOf(suffix, string.length - suffix.length) !== -1;
}
