module.exports = {
	bind : function(node, data) {
		utils.inheritMethods(data, new Data());

		data.node = node;

		return data;
	}
};

var q = require('q');
var fs = require('fs');

var utils = require("./utils");

/**
 * 
 */
function Data() {
	/**
	 * 
	 */
	Data.prototype.start = function() {
		var deferred = q.defer();

		try {
			if (!fs.existsSync(this.node.options.dataDirectory + "/" + this.id
					+ ".json")) {
				if (this.type == "string") {
					this.node[this.id] = "Willi";
				} else if (this.type == "any") {
					this.node[this.id] = {};
				} else {
					this.node[this.id] = {};
				}

				fs
						.writeFileSync(this.node.options.dataDirectory + "/"
								+ this.id + ".json", JSON
								.stringify(this.node[this.id]));
			} else {
				this.node[this.id] = JSON.parse(fs
						.readFileSync(this.node.options.dataDirectory + "/"
								+ this.id + ".json"));
			}

			console.log("\tData [" + this.id + "] loaded.");

			deferred.resolve();
		} catch (error) {
			console.log("\tFailed to initialize Service [" + Data.id + "]:");
			console.trace(error);

			deferred.reject();
		}

		return deferred.promise;
	};

	/**
	 * 
	 */
	Data.prototype.save = function() {
		var deferred = q.defer();

		if (this.isSimulated()) {
			deferred.resolve();
		} else {
			try {
				console.log("Saving data: ");
				console.log(this.node[this.id]);

				fs
						.writeFileSync(this.node.options.dataDirectory + "/"
								+ this.id + ".json", JSON
								.stringify(this.node[this.id]));
				deferred.resolve();
			} catch (error) {
				console.trace(error);

				deferred.reject();
			}
		}

		return deferred.promise;
	};

	/**
	 * 
	 */
	Data.prototype.isSimulated = function() {
		return this.node.isSimulated();
	};
}