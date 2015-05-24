/*******************************************************************************
 * Copyright (c) 2014-2015 Marc Gille. All rights reserved.
 ******************************************************************************/

define(["js/Utils", "js/ConsoleService"], function (Utils,
                                                    ConsoleService) {
    return {
        create: function (console, mesh) {
            return new MeshPage().initialize(console, mesh);
        }
    };

    function MeshPage() {
        /**
         *
         */
        MeshPage.prototype.initialize = function (console, mesh) {
            this.id = "mesh";
            this.console = console;
            this.mesh = mesh;

            return this;
        };

        /**
         *
         */
        MeshPage.prototype.show = function () {
            var deferred = jQuery.Deferred();

            ConsoleService
                .instance()
                .getMesh(this.mesh)
                .done(
                function (mesh) {
                    this.mesh = mesh;

                    deferred.resolve();
                }.bind(this)).fail(function (error) {
                    console.trace(error);

                    deferred.reject(error);
                });

            return deferred.promise();
        };

        /**
         *
         */
        MeshPage.prototype.leave = function () {
        };
    }
});
