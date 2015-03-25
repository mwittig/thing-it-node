/*******************************************************************************
 * Copyright (c) 2014-2015 Marc Gille. All rights reserved.
 ******************************************************************************/

define(["js/Utils", "js/ConsoleService"], function (Utils,
                                                    ConsoleService) {
    return {
        create: function (console) {
            return new MeshesPage().initialize(console);
        }
    };

    function MeshesPage() {
        /**
         *
         */
        MeshesPage.prototype.initialize = function (console) {
            this.id = "meshesPage";
            this.console = console;

            return this;
        };

        /**
         *
         */
        MeshesPage.prototype.show = function () {
            var deferred = jQuery.Deferred();

            ConsoleService
                .instance()
                .getMeshes()
                .done(
                function (meshes) {
                    this.meshes = meshes;

                    deferred.resolve();
                }.bind(this)).fail(function () {
                });

            return deferred.promise();
        };

        /**
         *
         */
        MeshesPage.prototype.leave = function () {
        };
    }
});
