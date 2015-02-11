/*******************************************************************************
 * Copyright (c) 2014-2015 Marc Gille. All rights reserved.
 ******************************************************************************/

define(
		[ "mobile/js/Utils" ],
		function(Utils) {
			return {
				bind : function(device, actor) {
					Utils.inheritMethods(actor, new Actor());

					actor.bind(device);

					return actor;
				}
			};

			/**
			 * 
			 */
			function Actor() {
				/**
				 * 
				 */
				Actor.prototype.bind = function(device) {
					this.device = device;
					
					// TODO Copy into type
					
					this.__type = this.device.getActorType(this.type);

					// Set default values

					for (var n = 0; n < this.__type.configuration.length; ++n) {
						if (!this.configuration[this.__type.configuration[n].id]) {
							this.configuration[this.__type.configuration[n].id] = this.__type.configuration[n].defaultValue;
						}
					}
				};
			}
		});