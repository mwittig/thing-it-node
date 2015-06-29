/*******************************************************************************
 * Copyright (c) 2014-2015 Marc Gille. All rights reserved.
 ******************************************************************************/

define(["js/Utils", "js/Node"], function (Utils, Node) {
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

        /**
         *
         */
        ConsoleService.prototype.get = function (url) {
            if (this.http) {
                var deferred = jQuery.Deferred();

                console.log("Invoking GET " + url);

                this.http.get(url).success(function (data) {
                    deferred.resolve(data);
                }).error(function (error) {
                    console.trace(error);

                    deferred.reject(error);
                });

                return deferred.promise();
            }
            else {
                return Utils.ajax(this.rootUrl + "/plugins", "GET",
                    "application/json");
            }
        };

        /**
         *
         */
        ConsoleService.prototype.post = function (url, data) {
            if (this.http) {
                var deferred = jQuery.Deferred();

                console.log("Invoking POST " + url);

                this.http.post(url, Utils
                    .cloneFiltered(data, /\_\_|\$\$/)).success(function (data) {
                    deferred.resolve(data);
                }).error(function (data) {
                    deferred.reject(data);
                });

                return deferred.promise();
            }
            else {
                return Utils.ajax(this.rootUrl + "/plugins", "POST",
                    "application/json", JSON.stringify(Utils
                        .cloneFiltered(data, /\_\_|\$\$/)));
            }
        };

        /**
         *
         */
        ConsoleService.prototype.put = function (url, data) {
            if (this.http) {
                var deferred = jQuery.Deferred();

                this.http.put(url, data).success(function (data) {
                    deferred.resolve(data);
                }).error(function (data) {
                    deferred.reject(data);
                });

                return deferred.promise();
            }
            else {
                return Utils.ajax(this.rootUrl + "/plugins", "PUT",
                    "application/json", JSON.stringify(Utils
                        .cloneFiltered(data, /\_\_|\$\$/)));
            }
        };

        /**
         * TODO May homogenize local URL to contain UUID as well.
         */
        ConsoleService.prototype.getNodeRootUrl = function (node) {
            if (this.settings.server === "local") {
                return this.rootUrl;
            }
            else {
                return this.rootUrl + "/nodes/" + node.uuid;
            }
        };

        /**
         *
         * @param node
         * @returns {string}
         */
        ConsoleService.prototype.getEventNamespaceUrl = function (node) {
            if (this.settings.server === "local") {
                return this.rootUrl + "/events";
            }
            else {
                return this.rootUrl + "/nodes/" + node.uuid + "/events";
            }
        };

        /**
         *
         * @param node
         * @returns {string}
         */
        ConsoleService.prototype.getComponentRootUrl = function (node) {
            if (this.settings.server === "local") {
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
            return this.get(this.rootUrl + "/plugins");
        };

        /**
         *
         */
        ConsoleService.prototype.getSettings = function () {
            var deferred = jQuery.Deferred();

            Utils.ajax(this.rootUrl + "/settings", "GET",
                "application/json").done(function (settings) {
                    this.settings = settings;

                    console.log("Settings ===>");
                    console.log(settings);

                    deferred.resolve(settings);
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
            return this.post(this.rootUrl + "/logout");
        };

        /**
         *
         */
        ConsoleService.prototype.getMeshes = function () {
            return this.get(this.rootUrl + "/meshes");
        };

        /**
         *
         */
        ConsoleService.prototype.getMesh = function (mesh) {
            return this.get(this.rootUrl + "/meshes/" + mesh._id);
        };

        /**
         *
         */
        ConsoleService.prototype.getNode = function (deviceTypes, mesh, node) {
            var deferred = jQuery.Deferred();

            if (this.settings.server === "local") {
                return this.get(this.rootUrl + "/configuration").done(function (node) {
                    node = Node
                        .bind(
                        deviceTypes,
                        node);

                    deferred.resolve(node);
                }.bind(this)).fail(function (error) {
                    console.trace(error);

                    deferred.reject(error);
                }.bind(this));
            }
            else {
                // TODO Homogenize

                return this.get(this.rootUrl + "/meshes/" + mesh._id + "/nodes/" + node._id).done(function (node) {
                    node = Node
                        .bind(
                        deviceTypes,
                        node);

                    deferred.resolve(node);
                }.bind(this)).fail(function (error) {
                    console.trace(error);

                    deferred.reject(data);
                }.bind(this));
            }

            return deferred.promise();
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

            console.log("WebSocket Namespace created at " + this.getEventNamespaceUrl(node));

            namespace.on('connection', function () {
                console.log("WebSocket Namespace connected at " + this.getEventNamespaceUrl(node));
            }.bind(this));
            namespace.on('disconnect', function () {
                console.log("WebSocket Namespace disconnected at " + this.getEventNamespaceUrl(node));
            }.bind(this));

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
            return this.post(this.getNodeRootUrl(node) + "/services/" + service.id, parameters);
        };

        /**
         *
         */
        ConsoleService.prototype.callDeviceService = function (device, service, parameters) {
            return this.post(this.getNodeRootUrl(device.__node) + "/devices/" + device.id
            + "/services/" + service, parameters);
        };

        /**
         *
         */
        ConsoleService.prototype.callActorService = function (actor, service,
                                                              parameters) {
            return this.post(this.getNodeRootUrl(actor.device.__node) + "/devices/" + actor.device.id
            + "/actors/" + actor.id + "/services/" + service, parameters);
        };

        /**
         *
         */
        ConsoleService.prototype.pushSensorValue = function (sensor, value) {
            return this.post(this.getNodeRootUrl(sensor.device.__node) + "/devices/" + sensor.device.id
            + "/sensors/" + sensor.id + "/data", {
                data: sensor._value
            });
        };

        /**
         *
         */
        ConsoleService.prototype.pushSensorEvent = function (sensor, event) {
            return this.post(this.getNodeRootUrl(sensor.device.__node) + "/devices/" + sensor.device.id
            + "/sensors/" + sensor.id + "/event", {
                type: event
            });
        };

        /**
         *
         */
        ConsoleService.prototype.getDataValue = function (node, data) {
            return this.get(this.getNodeRootUrl(node) + "/data/" + data.id);
        };

        /**
         *
         */
        ConsoleService.prototype.registerDevice = function (node, device) {
            return this.post(this.getNodeRootUrl(node) + "/devices/" + device.uuid + "/register", device);
        };

        /**
         *
         */
        ConsoleService.prototype.getComponentPluginDirectory = function (component) {
            if (!component) {
                return null;
            }

            if (component.device) {
                // Actors and sensors

                return this.getComponentRootUrl()
                    + component.device.__type.pluginDirectory + "/web/";
            }
            else {
                return this.getComponentRootUrl() + component.__type.pluginDirectory + "/web/";
            }
        };

        /**
         *
         */
        ConsoleService.prototype.getComponentPluginPath = function (component) {
            if (!component) {
                return null;
            }

            return this.getComponentPluginDirectory(component) + component.__type.family + ".html";
        };

        /**
         *
         */
        ConsoleService.prototype.getUsers = function (node) {
            return this.get(this.getNodeRootUrl(node) + "/users");
        };

        /**
         *
         */
        ConsoleService.prototype.getUser = function (id) {
            return this.get(this.getNodeRootUrl(node) + "/users/" + id);
        };

        /**
         *
         */
        ConsoleService.prototype.createUser = function (node, user) {
            return this.post(this.getNodeRootUrl(node) + "/users", user);
        };

        /**
         *
         */
        ConsoleService.prototype.updateUser = function (node, user) {
            return this.put(this.getNodeRootUrl(node) + "/users/" + user);
        };
    }
});
