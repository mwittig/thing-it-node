/*******************************************************************************
 * Copyright (c) 2014-2015 Marc Gille. All rights reserved.
 ******************************************************************************/

define([ "mobile/js/Utils", "mobile/js/ConsoleService" ], function(Utils,
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

			this.account = "marc.gille@sungard.com";
			this.password = "42";

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
