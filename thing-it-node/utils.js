module.exports = {
	inheritMethods : function inheritMethods(target, source) {
		for ( var member in source) {
			if (source[member] instanceof Function) {
				target[member] = source[member];
			}
		}
	},
	cloneFiltered : cloneFiltered
};

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