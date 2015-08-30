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

                    // Concurrently load Node states

                    for (var n in this.mesh.nodes) {
                        ConsoleService.instance().getNodeState(this.mesh.nodes[n]).done(function (state) {
                            this.mesh.nodes[n].state = state.state;
                            this.mesh.nodes[n].lastConfigurationTimestamp = state.lastConfigurationTimestamp;
                            this.mesh.nodes[n].firmwareVersion = state.firmwareVersion;

                            this.console.safeApply();
                        }.bind(this)).fail(function (error) {
                            console.error(error);
                        }.bind(this));
                    }

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
