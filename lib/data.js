module.exports = {
    bind: function (node, data) {
        utils.inheritMethods(data, new Data());

        data.node = node;

        return data;
    }
};

var q = require('q');
var fs = require('fs');
var logger = require("./logger");

var utils = require("./utils");

/**
 *
 */
function Data() {
    Data.prototype.clientCopy = function () {
        return {
            id: this.id,
            label: this.label,
            type: this.type
        };
    };

    /**
     *
     */
    Data.prototype.start = function () {
        utils.inheritMethods(this, logger.create());

        var deferred = q.defer();

        try {
            if (this.isSimulated() || !fs.existsSync(this.node.options.dataDirectory + "/" + this.id
                    + ".json")) {
                // TODO Check type

                this.node[this.id] = {};
            } else {
                this.node[this.id] = JSON.parse(fs
                    .readFileSync(this.node.options.dataDirectory + "/"
                        + this.id + ".json"));
            }

            this.logDebug("\tData [" + this.id + "] loaded.");

            deferred.resolve();
        } catch (error) {
            this.logError("\tFailed to initialize Data [" + this.id + "]:");

            deferred.reject();
        }

        return deferred.promise;
    };

    /**
     *
     */
    Data.prototype.update = function (object) {
        this.node[this.id] = object;

        return this.save();
    };

    /**
     *
     */
    Data.prototype.save = function () {
        var deferred = q.defer();

        if (this.isSimulated()) {
            deferred.resolve(this.node[this.id]);
        } else {
            try {
                this.logDebug("Saving data: ");
                this.logDebug(this.node[this.id]);

                fs
                    .writeFileSync(this.node.options.dataDirectory + "/"
                        + this.id + ".json", JSON
                        .stringify(this.node[this.id]));
                deferred.resolve(this.node[this.id]);
            } catch (error) {
                this.logError(error);

                deferred.reject(error);
            }
        }

        return deferred.promise;
    };

    /**
     *
     */
    Data.prototype.isSimulated = function () {
        return this.node.isSimulated();
    };
}