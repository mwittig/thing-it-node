/*******************************************************************************
 * Copyright (c) 2014-2015 Marc Gille. All rights reserved.
 ******************************************************************************/

define([ "mobile/js/Utils", "mobile/js/ConsoleService" ], function(Utils,
		ConsoleService) {
	return {
		create : function(console, sensor) {
			return new SensorPage().initialize(console, sensor);
		}
	};

	function SensorPage() {
		/**
		 * 
		 */
		SensorPage.prototype.initialize = function(console, sensor) {
			this.id = "sensorPage";
			this.console = console;
			this.sensor = sensor;

			return this;
		};

		/**
		 * 
		 */
		SensorPage.prototype.show = function() {
			var deferred = jQuery.Deferred();

			deferred.resolve();

			return deferred.promise();
		};

		/**
		 * 
		 */
		SensorPage.prototype.leave = function() {
		};
	}
});
