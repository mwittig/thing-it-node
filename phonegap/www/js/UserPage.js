/*******************************************************************************
 * Copyright (c) 2014-2015 Marc Gille. All rights reserved.
 ******************************************************************************/

define(["js/Utils", "js/ConsoleService"], function (Utils,
                                                    ConsoleService) {
    return {
        create: function (console, user) {
            return new UserPage().initialize(console, user);
        }
    };

    function UserPage() {
        /**
         *
         */
        UserPage.prototype.initialize = function (console, user) {
            this.id = "userPage";
            this.console = console;
            this.user = user;

            return this;
        };

        /**
         *
         */
        UserPage.prototype.show = function () {
            var deferred = jQuery.Deferred();

            //jQuery.mobile.loading("show");

            this.topGroups = [{
                label: "Our Home",
                type: "group",
                view: true,
                execute: true,
                subgroups: [{label: "Dining Room", type: "group", view: true, execute: true}, {
                    label: "Master Bedroom",
                    type: "group",
                    view: true,
                    execute: true
                }]
            },
                {label: "Our Health", type: "group", view: true, execute: true},
                {label: "Our Security", type: "group", view: true, execute: true}];

            this.treeNodes = [];

            this.createTreeNodes(null, this.topGroups, 0);

            deferred.resolve();

            return deferred.promise();
        };

        /**
         *
         */
        UserPage.prototype.createTreeNodes = function (parent, groups, level) {
            for (var n in groups) {
                var node = {
                    parent: parent,
                    level: level,
                    entitlement: groups[n],
                    hasChildren: groups[n].subgroups && groups[n].subgroups.length,
                    expanded: false
                };

                this.treeNodes.push(node);

                if (groups[n].subgroups) {
                    this.createTreeNodes(node, groups[n].subgroups, level + 1);
                }
            }
        };

        /**
         *
         */
        UserPage.prototype.leave = function () {
        };
    }
});
