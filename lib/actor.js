module.exports = {
    bind: function (device, actor) {
        utils.inheritMethods(actor, new Actor());
        utils.inheritMethods(actor, require(device.findActorType(actor.type).modulePath).create());

        actor.device = device;
        device[actor.id] = actor;

        return actor;
    }
};

var q = require('q');
var utils = require("./utils");

/**
 *
 */
function Actor() {
    /**
     *
     */
    Actor.prototype.startActor = function () {
        var deferred = q.defer();

        this.start().then(function () {
            try {
                this.device.node.app.post("/devices/" + this.device.id + "/actors/"
                + this.id + "/services/:service", function (req, res) {
                    this.device.node.verifyCallSignature(req, res, function () {
                        try {
                            this[req.params.service](req.body);

                            res.send(this.getState());
                        } catch (x) {
                            console.error(x);
                            res.status(500).send(
                                "Failed to invoke service ["
                                + req.params.service + "]: " + x);
                        }
                    });
                });

                this.publishStateChange();

                console.log("\t\tActor [" + this.label + "] started.");

                deferred.resolve();
            } catch (error) {
                console.error(x);

                deferred.reject("Failed to start Actor [" + self.label
                + "] started: " + error);
            }
        }.bind(this)).fail(function () {
        }.bind(this));

        return deferred.promise;
    };

    /**
     *
     */
    Actor.prototype.stop = function () {
        console.log("\t\tStopping Actor " + this.label);
    };

    /**
     *
     */
    Actor.prototype.publishStateChange = function () {
        this.device.node.publishActorStateChange(this.device, this, this
            .getState());
    }

    /**
     *
     */
    Actor.prototype.isSimulated = function () {
        return this.device.isSimulated();
    };
}