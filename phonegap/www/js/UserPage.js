/*******************************************************************************
 * Copyright (c) 2014-2015 Marc Gille. All rights reserved.
 ******************************************************************************/

define(["js/Utils", "js/ConsoleService", "js/User"], function (Utils,
                                                               ConsoleService, User) {
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
            this.id = "user";
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

            this.treeNodes = [];

            User.bind(this.console.node, this.user);

            this.createTreeNodes(null, this.user.groupEntitlements, 0);

            console.log(this.treeNodes);

            deferred.resolve();

            return deferred.promise();
        };

        /**
         *
         */
        UserPage.prototype.createTreeNodes = function (parent, entitlements, level) {
            for (var n in entitlements) {
                if (entitlements[n].type == "role") {
                    continue;
                }

                var node = {
                    parent: parent,
                    level: level,
                    entitlement: entitlements[n],
                    hasChildren: entitlements[n].groupEntitlements && entitlements[n].groupEntitlements.length ||
                    entitlements[n].deviceEntitlements && entitlements[n].deviceEntitlements.length,
                    expanded: false
                };

                this.treeNodes.push(node);

                if (entitlements[n].deviceEntitlements) {
                    this.createTreeNodes(node, entitlements[n].deviceEntitlements, level + 1);
                }

                if (entitlements[n].groupEntitlements) {
                    this.createTreeNodes(node, entitlements[n].groupEntitlements, level + 1);
                }
            }
        };

        /**
         *
         */
        UserPage.prototype.leave = function () {
        };

        /**
         *
         */
        UserPage.prototype.saveUser = function () {
            ConsoleService.instance().updateUser(this.console.node, this.user).then(function (user) {
                jQuery.mobile.loading("hide");
            }.bind(this)).fail(function (error) {
                jQuery.mobile.loading("hide");
            }.bind(this));
        };
    }
});
