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

function cloneFiltered(obj, filter) {
	if (obj == null || typeof (obj) != 'object')
		return obj;

	var temp = {};

	for ( var key in obj) {
		if (key == filter) {
			console.log("Skipping " + key);

			continue;
		}

		if (obj.hasOwnProperty(key)) {
			temp[key] = cloneFiltered(obj[key], filter);
		}
	}

	return temp;
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
