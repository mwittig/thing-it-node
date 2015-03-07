/*******************************************************************************
 * Copyright (c) 2014-2015 Marc Gille. All rights reserved.
 ******************************************************************************/

define([ "js/Utils", "js/ConsoleService" ], function(Utils,
		ConsoleService) {
	return {
		create : function(console, sensor) {
			return new DataPage().initialize(console, sensor);
		}
	};

	function DataPage() {
		/**
		 * 
		 */
		DataPage.prototype.initialize = function(console, data) {
			this.id = "dataPage";
			this.console = console;
			this.data = data;

			return this;
		};

		/**
		 * 
		 */
		DataPage.prototype.show = function() {
			var deferred = jQuery.Deferred();

			jQuery.mobile.loading("show");

			var self = this;

			ConsoleService.instance().getDataValue(this.data).done(
					function(dataValue) {
						jQuery.mobile.loading("hide");

						self.dataValue = dataValue;

						deferred.resolve();
					}).fail(function() {
				jQuery.mobile.loading("hide");
			});

			return deferred.promise();
		};

		/**
		 * 
		 */
		DataPage.prototype.getDataValueExtract = function(count) {
			var extract = "";
			var n = 0;

			for (key in this.dataValue) {
				if (n) {
					extract += ", ";
				}
				extract += key;
				extract += ": ";
				extract += this.dataValue[key];

				++n;

				if (n == count) {
					break;
				}
			}

			return extract;
		};

		/**
		 * 
		 */
		DataPage.prototype.leave = function() {
		};
	}
});
