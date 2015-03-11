/*******************************************************************************
 * Copyright (c) 2014-2015 Marc Gille. All rights reserved.
 ******************************************************************************/

define([ "js/Utils", "js/ConsoleService" ], function(Utils,
		ConsoleService) {
	return {
		create : function(console, actor) {
			return new DevicePage().initialize(console, actor);
		}
	};

	function DevicePage() {
		/**
		 * 
		 */
		DevicePage.prototype.initialize = function(console, device) {
			this.id = "devicePage";
			this.console = console;
			this.device = device;

			return this;
		};

		/**
		 * 
		 */
		DevicePage.prototype.show = function() {
			var deferred = jQuery.Deferred();

			deferred.resolve();

			return deferred.promise();
		};

		/**
		 * 
		 */
		DevicePage.prototype.leave = function() {
		};
	}
});
