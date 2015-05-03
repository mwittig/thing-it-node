/*******************************************************************************
 * Copyright (c) 2014-2015 Marc Gille. All rights reserved.
 ******************************************************************************/

define([ "js/Utils", "js/ConsoleService" ], function(Utils,
		ConsoleService) {
	return {
		create : function(console) {
			return new AdministrationPage().initialize(console);
		}
	};

	function AdministrationPage() {
		/**
		 * 
		 */
		AdministrationPage.prototype.initialize = function(console) {
			this.id = "administrationPage";
			this.console = console;

			return this;
		};

		/**
		 * 
		 */
		AdministrationPage.prototype.show = function() {
			var deferred = jQuery.Deferred();

            console.log("Admin showing");
			//jQuery.mobile.loading("show");

            deferred.resolve();

			return deferred.promise();
		};

		/**
		 * 
		 */
		AdministrationPage.prototype.leave = function() {
		};
	}
});
