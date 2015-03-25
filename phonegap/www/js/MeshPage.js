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
            this.id = "meshPage";
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
                }.bind(this)).fail(function () {
                });

            return deferred.promise();
        };

        /**
         *
         */
        MeshPage.prototype.openNodePage = function (node) {
            ConsoleService
                .instance()
                .getNode(this.mesh, node)
                .done(
                function (mesh) {
                    this.console.pushNodePage(node);
                }.bind(this));
        };

        /**
         *
         */
        MeshPage.prototype.leave = function () {
        };
    }
});
