module.exports = {
	inheritMethods : function inheritMethods(target, source) {
		for ( var member in source) {
			if (source[member] instanceof Function) {
				target[member] = source[member];
			}
		}
	},
	cloneFiltered : cloneFiltered,
	promiseSequence : promiseSequence
};

var q = require('q');
var lodash = require('lodash');

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

	if (index == list.length) {
		deferred.resolve();
	} else {
		list[index][method]().then(function() {
			promiseSequence(list, index + 1, method).then(function() {
				deferred.resolve();
			}).fail(function(error) {
				deferred.reject(error);
			});
		}).fail(function(error) {
			deferred.reject(error);
		});
	}

	return deferred.promise;
}
