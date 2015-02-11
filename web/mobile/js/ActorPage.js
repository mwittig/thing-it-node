/*******************************************************************************
 * Copyright (c) 2014-2015 Marc Gille. All rights reserved.
 ******************************************************************************/

define([ "mobile/js/Utils", "mobile/js/ConsoleService" ], function(Utils,
		ConsoleService) {
	return {
		create : function(console, actor) {
			return new ActorPage().initialize(console, actor);
		}
	};

	function ActorPage() {
		/**
		 * 
		 */
		ActorPage.prototype.initialize = function(console, actor) {
			this.id = "actorPage";
			this.console = console;
			this.actor = actor;

			return this;
		};

		/**
		 * 
		 */
		ActorPage.prototype.show = function() {
			var deferred = jQuery.Deferred();

			deferred.resolve();

			return deferred.promise();
		};

		/**
		 * 
		 */
		ActorPage.prototype.leave = function() {
		};

		/**
		 * 
		 */
		ActorPage.prototype.callActorService = function(service) {
			jQuery.mobile.loading("show");

			ConsoleService.instance().callActorService(this.actor, service, {})
					.done(function() {
						jQuery.mobile.loading("hide");
					}).fail(function() {
						jQuery.mobile.loading("hide");
					});
		};
	}
});
