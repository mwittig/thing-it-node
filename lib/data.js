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
        this.__type = this.node.findDataType(this.type);

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

                if (this.__type.family == 'primitive') {
                    if (this.__type.id == 'string') {
                        this.node[this.id] = "";
                    }
                    else if (this.__type.id == 'number') {
                        this.node[this.id] = 0;
                    }
                    else if (this.__type.id == 'decimal') {
                        this.node[this.id] = 0.0;
                    }
                    else if (this.__type.id == 'scientific') {
                        this.node[this.id] = 0.0;
                    }
                } else if (this.__type.family == 'enumeration') {
                    this.node[this.id] = "";
                } else {
                    this.node[this.id] = {};
                }
            } else {
                this.node[this.id] = JSON.parse(fs
                    .readFileSync(this.node.options.dataDirectory + "/"
                        + this.id + ".json"));

                if (this.__type.family == 'primitive' || this.__type.family == 'enumeration') {
                    this.node[this.id] = this.node[this.id]['ti-primitive-wrapper'];
                }
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
    Data.prototype.wrap = function () {
        if (this.__type.family == 'primitive' || this.__type.family == 'enumeration') {
            return {'ti-primitive-wrapper': this.node[this.id]};
        } else {
            return this.node[this.id];
        }
    };

    /**
     *
     */
    Data.prototype.unwrap = function (value) {
        if (this.__type.family == 'primitive' || this.__type.family == 'enumeration') {
            return value['ti-primitive-wrapper'];
        } else {
            return value;
        }
    };

    /**
     *
     */
    Data.prototype.update = function (value) {
        if (this.__type.family == 'primitive') {
            this.node[this.id] = value;
        } else {
            // Only update fields in the top level structure
            // TODO Recursive

            for (var m in value) {
                this.node[this.id][m] = value[m];
            }
        }

        var deferred = q.defer();

        this.save().then(function () {
            for (var n = 0; n < this.eventProcessors.length; ++n) {
                this.eventProcessors[n].pushDataStateChange(this, this.node[this.id]);
            }

            this.node.publishDataStateChange(this, this.wrap());
            deferred.resolve(this.wrap());
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

                fs.writeFileSync(this.node.options.dataDirectory + "/"
                        + this.id + ".json", JSON
                        .stringify(this.wrap()));
                deferred.resolve();
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