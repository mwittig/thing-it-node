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
        //this.rootUrl = "http://localhost:3001";
        this.rootUrl = window.location.protocol + "//"
        + window.location.hostname + ":" + window.location.port;

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
            return Utils.ajax(this.rootUrl + "/authentication", "GET",
                "application/json");
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
        ConsoleService.prototype.getNode = function () {
            return Utils.ajax(this.rootUrl + "/configuration", "GET",
                "application/json");
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

            var namespace = io.connect(this.rootUrl + "/events", {
                transports: transports
            });

            //namespace.on('connection', function () {
            window.setTimeout(function () {
                // Force Node to push state for all Devices and Actors

                Utils.ajax(this.rootUrl + "/poll", "POST",
                    "application/json");
            }.bind(this), 500);

            return namespace;
        };

        /**
         *
         */
        ConsoleService.prototype.callNodeService = function (service, parameters) {
            return Utils.ajax(this.rootUrl + "/services/" + service.id, "POST",
                "application/json", JSON.stringify(parameters));
        };

        /**
         *
         */
        ConsoleService.prototype.callDeviceService = function (device, service, parameters) {
            return Utils.ajax(this.rootUrl + "/devices/" + device.id
                + "/services/" + service, "POST",
                "application/json", JSON.stringify(parameters));
        };

        /**
         *
         */
        ConsoleService.prototype.callActorService = function (actor, service,
                                                              parameters) {
            return Utils.ajax(this.rootUrl + "/devices/" + actor.device.id
                + "/actors/" + actor.id + "/services/" + service, "POST",
                "application/json", JSON.stringify(parameters));
        };

        /**
         *
         */
        ConsoleService.prototype.pushSensorValue = function (sensor, value) {
            return Utils.ajax(this.rootUrl + "/devices/" + sensor.device.id
                + "/sensors/" + sensor.id + "/data", "POST",
                "application/json", JSON.stringify({
                    data: sensor._value
                }));
        };

        /**
         *
         */
        ConsoleService.prototype.pushSensorEvent = function (sensor, event) {
            return Utils.ajax(this.rootUrl + "/devices/" + sensor.device.id
                + "/sensors/" + sensor.id + "/event", "POST",
                "application/json", JSON.stringify({
                    type: event
                }));
        };

        /**
         *
         */
        ConsoleService.prototype.getDataValue = function (data) {
            return Utils.ajax(this.rootUrl + "/data/" + data.id, "GET",
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

                return this.rootUrl + "/default-devices/thing-it-device-"
                    + component.device.__type.module + "/web/"
                    + component.__type.family + ".html";
            }
            else {
                return this.rootUrl + "/default-devices/thing-it-device-"
                    + component.__type.module + "/web/"
                    + component.__type.family + ".html";
            }
        };
    }
});
