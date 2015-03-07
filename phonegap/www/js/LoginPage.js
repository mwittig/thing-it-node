/*******************************************************************************
 * Copyright (c) 2014-2015 Marc Gille. All rights reserved.
 ******************************************************************************/

define([ "js/Utils", "js/ConsoleService" ], function(Utils,
		ConsoleService) {
	return {
		create : function() {
			return new LoginPage().initialize(this);
		}
	};

	function LoginPage() {
		/**
		 * 
		 */
		LoginPage.prototype.initialize = function(console) {
			this.console = console;
			this.id = "loginPage";

			this.account = "test";
			this.password = "test";

			return this;
		};

		/**
		 * 
		 */
		LoginPage.prototype.show = function() {
			var deferred = jQuery.Deferred();

			deferred.resolve();
			
			return deferred.promise();			
		};

		/**
		 * 
		 */
		LoginPage.prototype.leave = function() {
		};
	}
});
