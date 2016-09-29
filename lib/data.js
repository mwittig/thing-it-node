module.exports = {
    bind: function (node, data) {
        utils.inheritMethods(data, new Data());

        return data.bind(node);
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
    /**
     *
     */
    Data.prototype.bind = function (node) {
        this.node = node;
        this.eventProcessors = [];

        return this;
    };

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

        this.logDebug("\tLoading Data [" + this.id + "].");

        var deferred = q.defer();

        try {
            if (this.isSimulated() || !fs.existsSync(this.node.options.dataDirectory + "/" + this.id
                    + ".json")) {
                // TODO Check type

                if (this.type.family == 'primitive') {
                    if (this.type.id == 'string') {
                        this.node[this.id] = "";
                    }
                    else if (this.type.id == 'number') {
                        this.node[this.id] = 0;
                    }
                    else if (this.type.id == 'decimal') {
                        this.node[this.id] = 0.0;
                    }
                    else if (this.type.id == 'scientific') {
                        this.node[this.id] = 0.0;
                    }
                } else if (this.type.family == 'enumeration') {
                    this.node[this.id] = "";
                } else {
                    this.node[this.id] = {};
                }
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
        // Only update fields in the top level structure
        // TODO Recursive

        for (var m in object) {
            this.node[this.id][m] = object[m];
        }

        var deferred = q.defer();

        this.save().then(function (state) {
            for (var n = 0; n < this.eventProcessors.length; ++n) {
                this.eventProcessors[n].pushDataStateChange(this, state);
            }

            this.node.publishDataStateChange(this, state);
            deferred.resolve(state);
        }.bind(this)).fail(function (error) {
            deferred.reject(error);
        }.bind(this));

        return deferred.promise;
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

                var wrapper = this.node[this.id];

                if (this.type.family == 'primitive') {
                    wrapper = {'ti-primitive-wrapper': this.node[this.id]};
                }

                fs
                    .writeFileSync(this.node.options.dataDirectory + "/"
                        + this.id + ".json", JSON
                        .stringify(wrapper));
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