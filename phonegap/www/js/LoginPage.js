/*******************************************************************************
 * Copyright (c) 2014-2015 Marc Gille. All rights reserved.
 ******************************************************************************/

define(["js/Utils", "js/ConsoleService"], function (Utils,
                                                    ConsoleService) {
    return {
        create: function (console) {
            return new LoginPage().initialize(console);
        }
    };

    function LoginPage() {
        /**
         *
         */
        LoginPage.prototype.initialize = function (console) {
            this.console = console;
            this.id = "loginPage";

            return this;
        };

        /**
         *
         */
        LoginPage.prototype.show = function () {
            var deferred = jQuery.Deferred();

            deferred.resolve();

            return deferred.promise();
        };

        /**
         *
         */
        LoginPage.prototype.leave = function () {
        };

        /**
         *
         */
        LoginPage.prototype.login = function () {
            this.console.login({account: this.account, password: this.password});
        };
    }
});
