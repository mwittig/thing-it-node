/*******************************************************************************
 * Copyright (c) 2014-2015 Marc Gille. All rights reserved.
 ******************************************************************************/

define([ "mobile/js/Utils" ], function(Utils) {
	return {
		instance : function() {

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
		this.rootUrl = window.location.protocol + "//"
				+ window.location.hostname + ":" + window.location.port;

		/**
		 * 
		 */
		ConsoleService.prototype.getDeviceTypes = function(node) {
			return Utils.ajax(this.rootUrl + "/plugins", "GET",
					"application/json");
		};

		/**
		 * 
		 */
		ConsoleService.prototype.login = function(account, password) {
			return Utils.ajax(this.rootUrl + "/login", "POST",
					"application/json", JSON.stringify({
						account : account,
						password : password
					}));
		};

		/**
		 * 
		 */
		ConsoleService.prototype.logout = function() {
			return Utils.ajax(this.rootUrl + "/logout", "POST",
					"application/json");
		};

		/**
		 * 
		 */
		ConsoleService.prototype.getNode = function() {
			return Utils.ajax(this.rootUrl + "/configuration", "GET",
					"application/json");
		};

		/**
		 * 
		 */
		ConsoleService.prototype.connectNode = function(io, node) {
			var transports;

			if ("WebSocket" in window && WebSocket.CLOSED > 2) {
				transports: [ 'websocket', 'xhr-polling' ]
			} else {
				transports: [ 'xhr-polling' ]
			}

			var namespace = io.connect(this.rootUrl + "/events", {
				transports : transports,
			});

			return namespace;
		};

		/**
		 * 
		 */
		ConsoleService.prototype.callNodeService = function(service) {
			return Utils.ajax(this.rootUrl + "/services/" + service.id, "POST",
					"application/json");
		};

		/**
		 * 
		 */
		ConsoleService.prototype.callActorService = function(actor, service) {
			return Utils.ajax(this.rootUrl + "/devices/" + actor.device.id
					+ "/actors/" + actor.id + "/services/" + service,
					"POST", "application/json");
		};

		/**
		 * 
		 */
		ConsoleService.prototype.pushSensorValue = function(sensor, value) {
			return Utils.ajax(this.rootUrl + "/devices/" + sensor.device.id
					+ "/sensors/" + sensor.id + "/data", "POST",
					"application/json", JSON.stringify({
						data : sensor.value
					}));
		};

		/**
		 * 
		 */
		ConsoleService.prototype.pushSensorEvent = function(sensor, event) {
			return Utils.ajax(this.rootUrl + "/devices/" + sensor.device.id
					+ "/sensors/" + sensor.id + "/event", "POST",
					"application/json", JSON.stringify({
						type : event
					}));
		};

		/**
		 * 
		 */
		ConsoleService.prototype.getDataValue = function(data) {
			return Utils.ajax(this.rootUrl + "/data/" + data.id, "GET",
					"application/json");
		};

		/**
		 * 
		 */
		ConsoleService.prototype.getComponentPluginPath = function(component) {
			if (!component) {
				return null;
			}

			var pluginPath = this.rootUrl + "/default-devices/thing-it-device-"
					+ component.device.__type.family + "/web/"
					+ component.__type.family + ".html";

			return pluginPath;
		};
	}
});
