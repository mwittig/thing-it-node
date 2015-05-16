/*******************************************************************************
 * Copyright (c) 2014-2015 Marc Gille. All rights reserved.
 ******************************************************************************/

define(
    ["js/Utils", "js/ConsoleService"],
    function (Utils, ConsoleService) {
        return {
            create: function (console, device) {
                return new DeviceMonitoringPage().initialize(console,
                    device);
            }
        };

        function DeviceMonitoringPage() {
            /**
             *
             */
            DeviceMonitoringPage.prototype.initialize = function (console,
                                                                  device) {
                this.id = "deviceMonitoring";
                this.console = console;
                this.device = device;
                this.plots = {};
                this.options = {};
                this.timers = {};

                return this;
            };

            /**
             *
             */
            DeviceMonitoringPage.prototype.show = function () {
                var deferred = jQuery.Deferred();

                this.initializeMonitoring()

                deferred.resolve();

                return deferred.promise();
            };

            /**
             *
             */
            DeviceMonitoringPage.prototype.leave = function () {
                this.uninitializeMonitoring()
            };

            /**
             *
             */
            DeviceMonitoringPage.prototype.initializeMonitoring = function () {
                if (!this.console.plotData[this.device.id]) {
                    this.console.plotData[this.device.id] = {};
                }

                for (var n in this.device.__type.state) {
                    var value = this.device.__type.state[n];

                    if (value.type.id != "number") {
                        continue;
                    }

                    var plotData = this.console.plotData[this.device.id][value.id];
                    var rate = 5000; //this.device.configuration.rate;
                    var now = new Date().getTime();

                    if (!plotData) {
                        plotData = {
                            interval: 60 * 1000,
                            series: []
                        };

                        this.console.plotData[this.device.id][value.id] = plotData;

                        // Populate plot data

                        for (var i = 0; i < (plotData.interval / rate); i++) {
                            plotData.series.push([
                                now - plotData.interval + (i * rate), 0]);
                        }
                    }

                    this.options[value.id] = {
                        seriesColors: ["#88B5B8"],
                        series: [{
                            showMarker: false,
                            lineWidth: 1.0
                        }],
                        axes: {
                            xaxis: {
                                numberTicks: 4,
                                renderer: jQuery.jqplot.DateAxisRenderer,
                                tickOptions: {
                                    formatString: '%H:%M:%S'
                                },
                                min: now - plotData.interval,
                                max: now
                            },
                            yaxis: {
                                numberTicks: 6,
                                tickOptions: {
                                    formatString: '%.1f'
                                },
                                min: value.min,
                                max: value.max
                            }
                        },
                        seriesDefaults: {
                            rendererOptions: {
                                smooth: true
                            }
                        },
                        grid: {
                            background: '#FFFFFF',
                            gridLineColor: '#DDDDDD',
                            borderColor: '#DDDDDD'
                        }
                    };
                }

                console.log("Plot Data");
                console.log(this.console.plotData);

                window
                    .setTimeout(
                    function () {
                        for (var n in this.device.__type.state) {
                            var value = this.device.__type.state[n];

                            if (value.type.id != "number") {
                                continue;
                            }

                            this.plots[value.id] = jQuery.jqplot(value.id + "-Plot",
                                [this.console.plotData[this.device.id][value.id].series],
                                this.options[value.id]);

                            var self = this;

                            //this.timers[value.id] = window
                            //    .setInterval(
                            //    function () {
                            //        self.console
                            //            .addValue(
                            //            self.device.id,
                            //            this.id,
                            //            self.console.plotData[self.device.id][this.id].series[self.console.plotData[self.device.id][this.id].series.length - 1][1]);
                            //        self.updatePlot(this.id);
                            //    }.bind(value), rate);
                        }
                    }.bind(this), 1000);
            };

            /**
             *
             */
            DeviceMonitoringPage.prototype.uninitializeMonitoring = function () {
                for (var n in this.device.__type.state) {
                    var value = this.device.__type.state[n];

                    window.clearInterval(this.timers[value.id]);
                }
            };

            /**
             *
             */
            DeviceMonitoringPage.prototype.updatePlots = function () {
                for (var n in this.device.__type.state) {
                    var value = this.device.__type.state[n];

                    if (value.type.id != "number") {
                        continue;
                    }

                    var plotData = this.console.plotData[this.device.id][value.id];
                    var now = new Date().getTime();

                    this.options[value.id].axes.xaxis.min = now - plotData.interval;
                    this.options[value.id].axes.xaxis.max = now;

                    this.plots[value.id].destroy();

                    this.plots[value.id] = jQuery.jqplot(value.id + "-Plot", [plotData.series],
                        this.options[value.id]);
                }
            };
        }
    });
