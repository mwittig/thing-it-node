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
