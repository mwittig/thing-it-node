/*******************************************************************************
 * Copyright (c) 2014-2015 Marc Gille. All rights reserved.
 ******************************************************************************/

define([ "mobile/js/Utils", "mobile/js/ConsoleService" ], function(Utils,
		ConsoleService) {
	return {
		create : function(console, group) {
			return new GroupPage().initialize(console, group);
		}
	};

	function GroupPage() {
		/**
		 * 
		 */
		GroupPage.prototype.initialize = function(console, group) {
			this.id = "groupPage";
			this.console = console;
			this.group = group;

			return this;
		};

		/**
		 * 
		 */
		GroupPage.prototype.show = function() {
			var deferred = jQuery.Deferred();

			this.services = this.group.services;
			
			deferred.resolve();

			return deferred.promise();
		};

		/**
		 * 
		 */
		GroupPage.prototype.leave = function() {
		};

		/**
		 * 
		 */
		GroupPage.prototype.showActorPage = function(actor) {
			this.console.actorPage.actor = actor;

			this.console.showPage(this.console.actorPage);
		};

		/**
		 * 
		 */
		GroupPage.prototype.back = function() {
			this.console.showPage(this.console.nodePage);
		};

		/**
		 * 
		 */
		GroupPage.prototype.callNodeService = function(service) {
			ConsoleService.instance().callNodeService(service, {})
					.done(function() {
						jQuery.mobile.loading("hide");
					}).fail(function() {
						jQuery.mobile.loading("hide");
					});
		};
	}
});
