/*******************************************************************************
 * Copyright (c) 2014-2015 Marc Gille. All rights reserved.
 ******************************************************************************/

define(["js/Utils", "js/ConsoleService"], function (Utils,
                                                    ConsoleService) {
    return {
        create: function (console, node) {
            return new NodePage().initialize(console, node);
        }
    };

    function NodePage() {
        /**
         *
         */
        NodePage.prototype.initialize = function (console, node) {
            this.id = "node";
            this.console = console;
            this.node = node;

            return this;
        };

        /**
         *
         */
        NodePage.prototype.show = function () {
            var deferred = jQuery.Deferred();

            try {
                // @deprecated

                this.console.node = this.node;

                this.console
                    .connectNode(this.node);

                this.sensors = [];
                this.actors = [];

                for (var m = 0; m < this.node.devices.length; ++m) {
                    for (var l = 0; l < this.node.devices[m].sensors.length; ++l) {
                        this.sensors.push(this.node.devices[m].sensors[l]);
                    }

                    for (var l = 0; l < this.node.devices[m].actors.length; ++l) {
                        this.actors.push(this.node.devices[m].actors[l]);
                    }
                }

                this.services = this.node.services;

                this.initializeSpeech();

                deferred.resolve();
            }
            catch (error) {
                console.trace(error);

                deferred.reject(error)
            }

            return deferred.promise();
        };

        /**
         *
         */
        NodePage.prototype.initializeSpeech = function () {
            var context = {productions: []};

            context.productions.push({
                name: "help",
                tokens: "help",
                synophones: "held",
                action: function () {
                    this.console.speech.utter("You have selected node " + this.node.label);
                }.bind(this)
            });
            context.productions.push({
                name: "Context",
                tokens: "context",
                action: function () {
                    this.console.speech.utter("You have selected node " + this.node.label);
                }.bind(this)
            });

            for (var n in this.node.groups) {
                context.productions.push({
                    name: "Group Navigation",
                    tokens: this.node.groups[n].label,
                    action: function () {
                        this.console.speech.utter("switching context to group " + this.node.groups[n].label);
                        this.console.pushGroupPage(this.node.groups[n]);
                    }.bind(this)
                });
            }

            this.console.speech.setContext(context);
        };

        /**
         *
         */
        NodePage.prototype.leave = function () {
        };

        /**
         *
         */
        NodePage.prototype.expandComponentUi = function (component) {
            this.component = component;

            this.console.Ui.turnOn("componentPluginUi");
        };
    }
});
