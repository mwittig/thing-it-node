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

            this.treeNodes = [];

            User.bind(this.user);

            this.createTreeNodes(null, this.user.entitlements, 0);

            deferred.resolve();

            return deferred.promise();
        };

        /**
         *
         */
        UserPage.prototype.createTreeNodes = function (parent, entitlements, level) {
            for (var n in entitlements) {
                if (entitlements[n].type == "role")
                {
                    continue;
                }

                var node = {
                    parent: parent,
                    level: level,
                    entitlement: entitlements[n],
                    hasChildren: entitlements[n].subGroups && entitlements[n].subGroups.length,
                    expanded: false
                };

                this.treeNodes.push(node);

                if (entitlements[n].subGroups) {
                    this.createTreeNodes(node, entitlements[n].subGroups, level + 1);
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
