/*******************************************************************************
 * Copyright (c) 2014-2015 Marc Gille. All rights reserved.
 ******************************************************************************/

define(["js/Utils", "js/ConsoleService"], function (Utils,
                                                    ConsoleService) {
    return {
        create: function (console) {
            return new UserManagementPage().initialize(console);
        }
    };

    function UserManagementPage() {
        /**
         *
         */
        UserManagementPage.prototype.initialize = function (console) {
            this.id = "userManagement";
            this.console = console;

            return this;
        };

        /**
         *
         */
        UserManagementPage.prototype.show = function () {
            var deferred = jQuery.Deferred();

            ConsoleService.instance().getUsers().then(function (result) {
                this.users = result.users;

                deferred.resolve();
            }.bind(this)).fail(function (error) {
                deferred.reject(error);
            }.bind(this));

            return deferred.promise();
        };

        /**
         *
         */
        UserManagementPage.prototype.leave = function () {
        };
    }
});
