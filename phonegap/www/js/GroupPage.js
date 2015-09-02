/*******************************************************************************
 * Copyright (c) 2014-2015 Marc Gille. All rights reserved.
 ******************************************************************************/

define(["js/Utils", "js/ConsoleService"], function (Utils,
                                                    ConsoleService) {
    return {
        create: function (console, group) {
            return new GroupPage().initialize(console, group);
        }
    };

    function GroupPage() {
        /**
         *
         */
        GroupPage.prototype.initialize = function (console, group) {
            this.id = "group";
            this.console = console;
            this.group = group;

            return this;
        };

        /**
         *
         */
        GroupPage.prototype.show = function () {
            var deferred = jQuery.Deferred();

            this.services = this.group.getServices();

            this.initializeSpeech();

            deferred.resolve();

            return deferred.promise();
        };

        /**
         *
         */
        GroupPage.prototype.leave = function () {
        };

        /**
         *
         */
        GroupPage.prototype.initializeSpeech = function () {
            var context = {productions: []};

            context.productions.push({
                name: "help",
                tokens: "help",
                action: function () {
                    this.console.speech.utter("You have selected group " + this.group.label);
                }.bind(this)
            });
            context.productions.push({
                name: "Context",
                tokens: "context",
                action: function () {
                    this.console.speech.utter("You have selected group " + this.group.label);
                }.bind(this)
            });

            for (var n in this.group.subGroups) {
                context.productions.push({
                    name: "Group Navigation",
                    tokens: this.group.subGroups[n].label,
                    action: function () {
                        this.console.speech.utter("switching context to group " + this.group.subGroups[n].label);
                        this.console.pushGroupPage(this.group.subGroups[n]);
                    }.bind(this)
                });
            }

            var devices = this.group.getDevices();

            for (var n in devices) {
                context.productions.push({
                    name: "Device Navigation",
                    tokens: devices[n].label,
                    action: function () {
                        this.console.speech.utter("changing to device " + devices[n].label);
                    }.bind(this)
                });

                for (var m in devices[n].services) {
                    context.productions.push({
                        name: "Device Service Call",
                        tokens: devices[n].label + " " + devices[n].services[m].label,
                        action: function () {
                            this.console.speech.utter(devices[n].label + " " + devices[n].services[m].label);
                        }.bind(this)
                    });
                }
            }

            this.console.speech.setContext(context);
        };

        /**
         *
         */
        GroupPage.prototype.showActorPage = function (actor) {
            this.console.actorPage.actor = actor;

            this.console.showPage(this.console.actorPage);
        };

        /**
         *
         */
        GroupPage.prototype.callNodeService = function (service) {
            ConsoleService.instance().callNodeService(service, {}).done(
                function () {
                    jQuery.mobile.loading("hide");
                }).fail(function () {
                    jQuery.mobile.loading("hide");
                });
        };

        /**
         *
         */
        GroupPage.prototype.expandComponentUi = function (component) {
            this.component = component;

            this.console.Ui.turnOn("componentPluginUi");
        };
    }
});
