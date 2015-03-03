define(
		[ "mobile/js/Utils" ],
		function(Utils) {
			return {
				initialize : initialize
			};

			function initialize(module) {
				module.directive('ngBlur', function() {
					return function(scope, elem, attrs) {
						elem.bind('blur', function() {
							scope.$apply(attrs.ngBlur);
						});
					};
				});
				module.directive("jqmLi", function() {
					return function($scope, element) {
						$(element).hide();
						setTimeout(function() {
							$scope.$on('$viewContentLoaded', element.parent()
									.listview('refresh'));
						}, 200);
						$(element).show();
					}
				});
				module.directive('tiKnob', function($timeout, $parse) {
					return {
						link : function(scope, element, attrs) {
							var options = scope.$eval(attrs.tiKnob);

							if (!options) {
								options = {};
							}

							options.min = scope.$eval(attrs.tiMin);
							options.max = scope.$eval(attrs.tiMax);
							options.change = function(value) {
								var expression = attrs.tiModel + "=" + value;
								scope.$eval(expression);

								if (attrs.tiChange) {
									bufferedChange(scope, element, value,
											attrs.tiChange, 500);
								}
							}
							options.release = function(value) {
								var expression = attrs.tiModel + "=" + value;

								scope.$eval(expression);

								if (attrs.tiChange) {
									bufferedChange(scope, element, value,
											attrs.tiChange, 500);
								}
							}

							jQuery(element).knob(options);
							jQuery(element).data("lastChangeTimestamp",
									new Date().getTime());

							scope.$watch(attrs.tiModel, function(value) {
								jQuery(element).val(value).trigger('change');
							});
						}
					};
				});
				module.directive('tiSlider', function($timeout, $parse) {
					return {
						link : function(scope, element, attrs) {
							var options = scope.$eval(attrs.tiSlider);

							if (!options) {
								options = {};
							}

							jQuery(element).ionRangeSlider(
									{
										rangeClass : 'rangeslider',
										fillClass : 'rangeslider__fill',
										handleClass : 'rangeslider__handle',
										onChange : function(position, value) {
											var expression = attrs.tiModel
													+ "=" + value;
											scope.$eval(expression);

											if (attrs.tiChange) {
												bufferedChange(scope, element,
														value, attrs.tiChange,
														500);
											}
										},
										onFinish : function(position, value) {
											var expression = attrs.tiModel
													+ "=" + value;

											scope.$eval(expression);

											if (attrs.tiChange) {
												bufferedChange(scope, element,
														value, attrs.tiChange,
														500);
											}
										}
									});
							jQuery(element).data("lastChangeTimestamp",
									new Date().getTime());

							scope.$watch(attrs.tiModel, function(value) {
								jQuery(element).val(value).change();
							});
						}
					};
				});
			}

			/**
			 * 
			 */
			function bufferedChange(scope, element, value, tiChange,
					bufferLength) {
				if (new Date().getTime()
						- jQuery(element).data("lastChangeTimestamp") < bufferLength) {
					console.log("" + new Date() + ": Overwrite buffered value "
							+ value);
				} else {
					// Apply the change and start next buffer interval

					console.log("" + new Date()
							+ ": Execute immediate change with " + value);
					jQuery(element).data("lastChangeTimestamp",
							new Date().getTime());
					scope.$eval(tiChange);

					window.setTimeout(function() {
						// Values are cached in the model

						console.log("" + new Date() + ": Delayed execution");
						scope.$eval(tiChange);
					}, bufferLength);
				}
			}
		});
