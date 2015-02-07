/*******************************************************************************
 * Copyright (c) 2014-2015 Marc Gille. All rights reserved.
 ******************************************************************************/

define([ "mobile/js/Utils", "mobile/js/ConsoleService" ], function(Utils,
		ConsoleService) {
	return {
		create : function(console, node) {
			return new NodePage().initialize(console, node);
		}
	};

	function NodePage() {
		/**
		 * 
		 */
		NodePage.prototype.initialize = function(console, node) {
			this.id = "nodePage";
			this.console = console;
			this.node = node;

			return this;
		};

		/**
		 * 
		 */
		NodePage.prototype.show = function() {
			var deferred = jQuery.Deferred();

			this.sensors = [];
			this.actors = [];

			for (var m = 0; m < this.node.devices.length; ++m) {
				for (var l = 0; l < this.node.devices[m].sensors.length; ++l) {
					this.sensors.push(this.node.devices[m].sensors[l]);
				}

				for (var l = 0; l < this.node.devices[m].actors.length; ++l) {
					this.actors.push(this.node.devices[m].actors[l]);
				}
			}

			this.services = this.node.services;
			
			deferred.resolve();

			return deferred.promise();
		};

		/**
		 * 
		 */
		NodePage.prototype.leave = function() {
		};

		/**
		 * 
		 */
		NodePage.prototype.callNodeService = function(service) {
			jQuery.mobile.loading("show");

			ConsoleService.instance().callNodeService(service, {}).done(
					function() {
						jQuery.mobile.loading("hide");
					}).fail(function() {
				jQuery.mobile.loading("hide");
			});
		};
	}
});
