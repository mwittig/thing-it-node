module.exports = {
    create: function (node, eventProcessor) {
        utils.inheritMethods(eventProcessor, new EventProcessor());

        eventProcessor.node = node;
        eventProcessor.scope = new Scope();

        // TODO may pass eventProcessor as execution scope and not use as variable - still ... needs to be unique

        node[eventProcessor.id] = eventProcessor.scope;

        if (eventProcessor.content.type == "script") {
            eventProcessor.callbackScript = node
                .preprocessScript(eventProcessor.content.script);
        } else if (eventProcessor.content.type == "nodeService") {
            eventProcessor.callbackScript = node
                .preprocessScript(eventProcessor.content.service + "();");
        } else if (eventProcessor.content.type == "actorService") {
            eventProcessor.callbackScript = node
                .preprocessScript(eventProcessor.content.actor + "."
                + eventProcessor.content.service + "();");
        }

        return eventProcessor;
    }
};

var utils = require("./utils");
var q = require('q');

/**
 *
 */
function EventProcessor() {
    /**
     *
     */
    EventProcessor.prototype.register = function () {
        // this.matchFunction = new Function("scope",
        // "with (scope){ console.log(\"" + this.match + "\"); "
        // + "console.log(" + this.match + "); return "
        // + this.match + ";}");
        this.matchFunction = new Function("scope", "with (scope){ return "
            + this.match + ";}");

        for (var n = 0; n < this.observables.length; ++n) {
            if (this.observables[n].indexOf(".") < 0) {
                // Device to be observed

                this.scope[this.observables[n]] = {
                    event: null,
                    series: []
                };

                for (var m in this.node[this.observables[n]].type.state) {
                    this.scope[this.observables[n]][this.node[this.observables[n]].type.state[m].id] = {series: []};
                }

                this.node[this.observables[n]].eventProcessors.push(this);
            }
            else {
                var path = this.observables[n].split(".");

                if (!this.scope[path[0]]) {
                    this.scope[path[0]] = {};
                }

                this.scope[path[0]][path[1]] = {
                    event: null,
                    series: []
                };

                this.node[path[0]][path[1]].eventProcessors.push(this);
            }
        }
    };

    /**
     * Records Sensor data for evaluation at the end of the window
     */
    EventProcessor.prototype.push = function (sensor, value) {
        // console.log("Add data " + value + " for " + sensor.id);

        if (this.window) {
            this.scope[sensor.device.id][sensor.id].series.push({
                value: value,
                timestamp: new Date().getTime()
            });
        }
    };

    /**
     * Notifies the Event Processor of an Event on a Sensor.
     */
    EventProcessor.prototype.notifyOnDeviceEvent = function (device, event) {
        console.log("Receiving event");
        console.log(event);

        // TODO What is this for
        x
        for (var n = 0; n < this.observables.length; ++n) {
            if (this.observables[n].indexOf(".") < 0) {
                this.scope[this.observables[n]].event = null;
            }
            else {
                var path = this.observables[n].split(".");

                this.scope[path[0]][path[1]].event = null;
            }
        }

        this.scope[device.id].event = event;

        // TODO Evaluate event only if "event" property was set, otherwise
        // collect events

        try {
            if (this.matchFunction(this.scope)) {
                this.execute();
            }
        } catch (error) {
            console.error("Error executing match function for Event Processor [" + this.label + "]: " + error);
        }
    };

    EventProcessor.prototype.pushDeviceState = function (device, state) {
        if (this.window) {
            for (var n in state) {
                // Guard for incomplete state definitions

                if (!this.scope[device.id][n]) {
                    continue;
                }

                this.scope[device.id][n].series.push({
                    value: state[n],
                    timestamp: new Date().getTime()
                });
            }
        }
    };

    /**
     * Notifies the Event Processor of an Event on a Sensor.
     */
    EventProcessor.prototype.notify = function (sensor, event) {
        console.log("Receiving event");
        console.log(event);

        for (var n = 0; n < this.observables.length; ++n) {
            if (this.observables[n].indexOf(".") < 0) {
                this.scope[this.observables[n]].event = null;
            }
            else {
                var path = this.observables[n].split(".");

                this.scope[path[0]][path[1]].event = null;
            }
        }

        this.scope[sensor.device.id][sensor.id].event = event;

        // TODO Evaluate event only if "event" property was set, otherwise
        // collect events

        try {
            console.log("Check match ");

            if (this.matchFunction(this.scope)) {
                console.log("Exec ");
                this.execute();
            }
        } catch (error) {
            console.error("Error executing match function for Event Processor [" + this.label + "]: " + error);
        }
    };

    /**
     * Start listening.
     */
    EventProcessor.prototype.start = function () {
        this.register();

        if (this.window) {
            setInterval(function () {
                //console.log("Interval for " + this.label);
                //
                //for (var n = 0; n < this.observables.length; ++n) {
                //    if (this.observables[n].indexOf(".") < 0) {
                //        console.log(this.scope[this.observables[n]]);
                //    }
                //    else {
                //        var path = this.observables[n].split(".");
                //
                //        console.log(this.scope[path[0]][path[1]]);
                //    }
                //}

                try {
                    if (this.matchFunction(this.scope)) {
                        this.execute();
                    }
                } catch (error) {
                    // Null pointer exception or the like

                    console.error("Exception in match function of Event Processor [" + this.label + "]: " + error);
                }

                // Reinitialize series

                for (var n = 0; n < this.observables.length; ++n) {
                    if (this.observables[n].indexOf(".") < 0) {
                        // TODO
                    }
                    else {
                        var path = this.observables[n].split(".");

                        this.scope[path[0]][path[1]] = {
                            series: []
                        };
                    }
                }
            }.bind(this), this.window.duration)
        }

        console.log("\tEvent Processor [" + this.label + "] listening.");
    };

    /**
     * Execute the Event Processor logic.
     */
    EventProcessor.prototype.execute = function () {
        try {
            this.node.executeScript(this.callbackScript);
        } catch (error) {
            console.log("Failed to invoke Script for Event Processor ["
                + this.id + "]:");
            console.log(error);
        }
    };
}

/**
 *
 */
function Scope() {
    /**
     *
     */
    Scope.prototype.minimum = function (data) {
        var minimum = 10000000000; // TODO

        for (var n = 0; n < data.length; ++n) {
            minimum = Math.min(minimum, data[n].value);
        }

        return minimum;
    };

    /**
     *
     */
    Scope.prototype.maximum = function (data) {
        var maximum = -10000000000; // TODO

        for (var n = 0; n < data.length; ++n) {
            maximum = Math.max(maximum, data[n].value);
        }

        return maximum;
    };

    /**
     *
     */
    Scope.prototype.average = function (data) {
        var sum = 0;

        for (var n = 0; n < data.length; ++n) {
            sum += data[n].value;
        }

        // console.log("average() = " + sum / data.length);

        return sum / data.length;
    };

    /**
     *
     */
    Scope.prototype.deviation = function (data) {
        var average = this.average(data);

        var sum = 10000000000; // TODO

        for (var n = 0; n < data.length; ++n) {
            sum = (data[n].value - average) * (data[n].value - average);
        }

        // console.log("deviation() = " + Math.sqrt(sum));

        return Math.sqrt(sum);
    };
}
