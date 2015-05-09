/*******************************************************************************
 * Copyright (c) 2014-2015 Marc Gille. All rights reserved.
 ******************************************************************************/

define(["js/Utils"], function (Utils) {
    return {
        instance: function () {

            if (!document.consoleService) {
                document.consoleService = new ConsoleService();
            }

            return document.consoleService;
        }
    };

    /**
     *
     */
    function ConsoleService() {
        //this.rootUrl = "";
        this.rootUrl = window.location.protocol + "//"
        + window.location.hostname + ":" + window.location.port;
        this.proxyMode = "local";

        /**
         * TODO May homogenize local URL to contain UUID as well.
         */
        ConsoleService.prototype.getNodeRootUrl = function (node) {
            if (this.proxyMode == "local") {
                return this.rootUrl;
            }
            else {
                return this.rootUrl + "/reverse-proxy/nodes/" + node.uuid;
            }
        };

        /**
         *
         * @param node
         * @returns {string}
         */
        ConsoleService.prototype.getEventNamespaceUrl = function (node) {
            if (this.proxyMode == "local") {
                return this.rootUrl + "/events";
            }
            else {
                return this.rootUrl + "/reverse-proxy/nodes/" + node.uuid + "/client/events";
            }
        };

        /**
         *
         * @param node
         * @returns {string}
         */
        ConsoleService.prototype.getComponentRootUrl = function (node) {
            if (this.proxyMode == "local") {
                return this.rootUrl;
            }
            else {
                return this.rootUrl + "/thing-it-node";
            }
        };

        /**
         *
         */
        ConsoleService.prototype.getDeviceTypes = function (node) {
            return Utils.ajax(this.rootUrl + "/plugins", "GET",
                "application/json");
        };

        /**
         *
         */
        ConsoleService.prototype.getAuthenticationMode = function () {
            var deferred = jQuery.Deferred();

            Utils.ajax(this.rootUrl + "/authentication", "GET",
                "application/json").done(function (authenticationMode) {
                    if (authenticationMode.proxyMode) {
                        this.proxyMode = authenticationMode.proxyMode;
                    }

                    deferred.resolve(authenticationMode);
                }.bind(this)).fail(function () {
                    deferred.reject();
                });

            return deferred.promise();
        };

        /**
         *
         */
        ConsoleService.prototype.login = function (credentials) {
            return Utils.ajax(this.rootUrl + "/login", "POST",
                "application/json", JSON.stringify(credentials));
        };

        /**
         *
         */
        ConsoleService.prototype.logout = function () {
            return Utils.ajax(this.rootUrl + "/logout", "POST",
                "application/json");
        };

        /**
         *
         */
        ConsoleService.prototype.getMeshes = function () {
            return Utils.ajax(this.rootUrl + "/meshes", "GET",
                "application/json");
        };

        /**
         *
         */
        ConsoleService.prototype.getMesh = function (mesh) {
            return Utils.ajax(this.rootUrl + "/meshes/" + mesh._id, "GET");
        };

        /**
         *
         */
        ConsoleService.prototype.getNode = function (mesh, node) {
            if (this.proxyMode == "local") {
                return Utils.ajax(this.rootUrl + "/configuration", "GET",
                    "application/json");
            }
            else {
                return Utils.ajax(this.rootUrl + "/meshes/" + mesh._id + "/nodes/" + node._id, "GET",
                    "application/json");
            }
        };

        /**
         *
         */
        ConsoleService.prototype.connectNode = function (io, node) {
            var transports;

            if ("WebSocket" in window && WebSocket.CLOSED > 2) {
                transports: ['websocket', 'xhr-polling']
            } else {
                transports: ['xhr-polling']
            }

            var namespace = io.connect(this.getEventNamespaceUrl(node), {
                transports: transports
            });

            namespace.on('connect', function () {
            });

            window.setTimeout(function () {
                // Force Node to push state for all Devices and Actors

                Utils.ajax(this.getNodeRootUrl(node) + "/poll", "POST",
                    "application/json");
            }.bind(this), 500);

            return namespace;
        };

        /**
         *
         */
        ConsoleService.prototype.callNodeService = function (node, service, parameters) {
            return Utils.ajax(this.getNodeRootUrl(node) + "/services/" + service.id, "POST",
                "application/json", JSON.stringify(parameters));
        };

        /**
         *
         */
        ConsoleService.prototype.callDeviceService = function (node, device, service, parameters) {
            return Utils.ajax(this.getNodeRootUrl(node) + "/devices/" + device.id
                + "/services/" + service, "POST",
                "application/json", JSON.stringify(parameters));
        };

        /**
         *
         */
        ConsoleService.prototype.callActorService = function (node, actor, service,
                                                              parameters) {
            return Utils.ajax(this.getNodeRootUrl(node) + "/devices/" + actor.device.id
                + "/actors/" + actor.id + "/services/" + service, "POST",
                "application/json", JSON.stringify(parameters));
        };

        /**
         *
         */
        ConsoleService.prototype.pushSensorValue = function (node, sensor, value) {
            return Utils.ajax(this.getNodeRootUrl(node) + "/devices/" + sensor.device.id
                + "/sensors/" + sensor.id + "/data", "POST",
                "application/json", JSON.stringify({
                    data: sensor._value
                }));
        };

        /**
         *
         */
        ConsoleService.prototype.pushSensorEvent = function (node, sensor, event) {
            return Utils.ajax(this.getNodeRootUrl(node) + "/devices/" + sensor.device.id
                + "/sensors/" + sensor.id + "/event", "POST",
                "application/json", JSON.stringify({
                    type: event
                }));
        };

        /**
         *
         */
        ConsoleService.prototype.getDataValue = function (node, data) {
            return Utils.ajax(this.getNodeRootUrl(node) + "/data/" + data.id, "GET",
                "application/json");
        };

        /**
         *
         */
        ConsoleService.prototype.registerDevice = function (node, device) {
            return Utils.ajax(this.getNodeRootUrl(node) + "/devices/" + device.uuid + "/register", "POST",
                "application/json");
        };

        /**
         *
         */
        ConsoleService.prototype.getComponentPluginPath = function (component) {
            if (!component) {
                return null;
            }

            if (component.device) {
                // Actors and sensors

                return this.getComponentRootUrl()
                    + component.device.__type.pluginDirectory + "/web/"
                    + component.__type.family + ".html";
            }
            else {
                return this.getComponentRootUrl() + component.__type.pluginDirectory + "/web/"
                    + component.__type.family + ".html";
            }
        };

        /**
         *
         */
        ConsoleService.prototype.getUsers = function (node) {
            return Utils.ajax(this.getNodeRootUrl(node) + "/users", "GET",
                "application/json");
        };

        /**
         *
         */
        ConsoleService.prototype.getUser = function (id) {
            return Utils.ajax(this.getNodeRootUrl(node) + "/users/" + id, "GET",
                "application/json");
        };

        /**
         *
         */
        ConsoleService.prototype.createUser = function (node, user) {
            return Utils.ajax(this.getNodeRootUrl(node) + "/users", "POST",
                "application/json", JSON.stringify(Utils
                    .cloneFiltered(user, /\_\_|\$\$/)));
        };

        /**
         *
         */
        ConsoleService.prototype.updateUser = function (node, user) {
            return Utils.ajax(this.getNodeRootUrl(node) + "/users/" + user.account, "PUT",
                "application/json", JSON.stringify(Utils
                    .cloneFiltered(user, /\_\_|\$\$/)));
        };
    }
});
