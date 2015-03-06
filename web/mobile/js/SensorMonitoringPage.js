/*******************************************************************************
 * Copyright (c) 2014-2015 Marc Gille. All rights reserved.
 ******************************************************************************/

define(
		[ "mobile/js/Utils", "mobile/js/ConsoleService" ],
		function(Utils, ConsoleService) {
			return {
				create : function(console, sensor) {
					return new SensorMonitoringPage().initialize(console,
							sensor);
				}
			};

			function SensorMonitoringPage() {
				/**
				 * 
				 */
				SensorMonitoringPage.prototype.initialize = function(console,
						sensor) {
					this.id = "sensorMonitoringPage";
					this.console = console;
					this.sensor = sensor;

					return this;
				};

				/**
				 * 
				 */
				SensorMonitoringPage.prototype.show = function() {
					var deferred = jQuery.Deferred();

					this.initializeMonitoring()

					deferred.resolve();

					return deferred.promise();
				};

				/**
				 * 
				 */
				SensorMonitoringPage.prototype.leave = function() {
					this.uninitializeMonitoring()
				};

				/**
				 * 
				 */
				SensorMonitoringPage.prototype.initializeMonitoring = function() {
					this.metric = {};

					if (!this.console.sensorPlotData[this.sensor.device.id]) {
						this.console.sensorPlotData[this.sensor.device.id] = {};
					}

					var plotData = this.console.sensorPlotData[this.sensor.device.id][this.sensor.id];
					var rate = this.sensor.configuration.rate;
					var now = new Date().getTime();

					if (!plotData) {
						plotData = {
							interval : 60 * 1000,
							series : []
						};

						this.console.sensorPlotData[this.sensor.device.id][this.sensor.id] = plotData;

						// Populate plot data

						for (var i = 0; i < (plotData.interval / rate); i++) {
							plotData.series.push([
									now - plotData.interval + (i * rate), 0 ]);
						}
					}

					console.log("Sensor Plot Data");
					console.log(this.console.sensorPlotData);

					this.options = {
						seriesColors : [ "#57458A" ],
						series : [ {
							showMarker : false,
							lineWidth : 1.0
						} ],
						axes : {
							xaxis : {
								numberTicks : 4,
								renderer : jQuery.jqplot.DateAxisRenderer,
								tickOptions : {
									formatString : '%H:%M:%S'
								},
								min : now - plotData.interval,
								max : now
							},
							yaxis : {
								numberTicks : 6,
								tickOptions : {
									formatString : '%.1f'
								},
								min : this.sensor.configuration.min,
								max : this.sensor.configuration.max,
							}
						},
						seriesDefaults : {
							rendererOptions : {
								smooth : true
							}
						},
						grid : {
							background : '#FFFFFF',
							gridLineColor : '#DDDDDD',
							borderColor : '#DDDDDD'
						}
					};

					var self = this;

					window
							.setTimeout(
									function() {
										self.plot = jQuery.jqplot("plot",
												[ plotData.series ],
												self.options);
										self.timer = window
												.setInterval(
														function() {
															self.console
																	.addValue(
																			self.sensor.device.id,
																			self.sensor.id,
																			plotData.series[plotData.series.length - 1][1]);
															self.updatePlot();
														}, rate);
									}, 500);
				};

				/**
				 * 
				 */
				SensorMonitoringPage.prototype.uninitializeMonitoring = function() {
					window.clearInterval(this.timer);
				};

				/**
				 * 
				 */
				SensorMonitoringPage.prototype.updatePlot = function() {
					var plotData = this.console.sensorPlotData[this.sensor.device.id][this.sensor.id];
					var now = new Date().getTime();

					this.options.axes.xaxis.min = now - plotData.interval;
					this.options.axes.xaxis.max = now;

					this.plot.destroy();

					this.plot = jQuery.jqplot("plot", [ plotData.series ],
							this.options);
				};
			}
		});
