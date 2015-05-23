/*******************************************************************************
 * Copyright (c) 2014-2015 Marc Gille. All rights reserved.
 ******************************************************************************/

define([ "js/Utils", "js/ConsoleService" ], function(Utils,
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
			this.id = "group";
			this.console = console;
			this.group = group;

			return this;
		};

		/**
		 * 
		 */
		GroupPage.prototype.show = function() {
			var deferred = jQuery.Deferred();

			this.services = this.group.getServices();

            console.log("Group ", this.group);

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
		GroupPage.prototype.callNodeService = function(service) {
			ConsoleService.instance().callNodeService(service, {}).done(
					function() {
						jQuery.mobile.loading("hide");
					}).fail(function() {
				jQuery.mobile.loading("hide");
			});
		};

        /**
         *
         */
        GroupPage.prototype.expandComponentUi = function(component) {
            this.component = component;

            this.console.Ui.turnOn("componentPluginUi");
        };
    }
});
