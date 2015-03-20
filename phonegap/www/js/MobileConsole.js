/*******************************************************************************
 * Copyright (c) 2014-2015 Marc Gille. All rights reserved.
 ******************************************************************************/

define(
    ["js/Utils", "js/Node", "js/ConsoleService",
        "js/LoginPage", "js/NodePage",
        "js/GroupPage", "js/DevicePage", "js/ActorPage",
        "js/SensorPage", "js/DataPage",
        "js/SensorMonitoringPage"],
    function (Utils, Node, ConsoleService, LoginPage, NodePage, GroupPage, DevicePage,
              ActorPage, SensorPage, DataPage, SensorMonitoringPage) {
        return {
            create: function () {
                return new MobileConsole();
            }
        };

        /**
         *
         */
        function MobileConsole() {
            /**
             *
             */
            MobileConsole.prototype.initialize = function (io) {
                this.io = io;
                this.pageStack = [];
                this.sensorPlotData = {};

                var self = this;

                ConsoleService
                    .instance()
                    .getAuthenticationMode()
                    .done(
                    function (authenticationMode) {
                        console.log("Authentication Mode");
                        console.log(authenticationMode);

                        if (authenticationMode.type == "none") {
                            self.login();
                        }
                        else {
                            self.pageStack.push(self.loginPage = LoginPage.create(self));

                            self.showPage(self.loginPage);
                        }
                    }).fail(function () {
                    });
            };

            /**
             *
             */
            MobileConsole.prototype.showPage = function (page, object) {
                var promise;

                if (object) {
                    promise = page.show(object);
                } else {
                    promise = page.show();
                }

                jQuery(document).on('pagebeforeshow', function () {
                    console.log("pagebeforeshow");
                    // self.safeApply();
                });

                var self = this;

                promise.done(function () {
                    self.safeApply();

                    window.setTimeout(function () {
                        console.log("changepage");
                        jQuery.mobile.changePage("#" + page.id);
                    }, 500);
                }).fail(function (error) {
                    console.error(error);
                });
            };

            /**
             *
             */
            MobileConsole.prototype.topPage = function () {
                if (this.pageStack.length) {
                    return this.pageStack[this.pageStack.length - 1];
                }

                return null;
            };

            /**
             *
             */
            MobileConsole.prototype.pushPage = function (page) {
                if (this.topPage()) {
                    this.topPage().leave();
                }

                this.pageStack.push(page);
                this.showPage(page);
            };

            /**
             *
             */
            MobileConsole.prototype.popPage = function () {
                if (this.topPage()) {
                    this.pageStack.pop().leave();
                }

                if (this.topPage()) {
                    this.showPage(this.topPage());
                }
            };

            /**
             *
             */
            MobileConsole.prototype.rootPage = function (page) {
                if (this.topPage()) {
                    this.pageStack.pop().leave();
                }

                this.pageStack = [page];

                this.showPage(page);
            };

            /**
             *
             */
            MobileConsole.prototype.login = function (credentials) {
                var self = this;

                jQuery.mobile.loading("show");

                ConsoleService
                    .instance()
                    .login(credentials)
                    .done(
                    function (loggedInUser) {
                        self.loggedInUser = loggedInUser;

                        ConsoleService
                            .instance()
                            .getDeviceTypes()
                            .done(
                            function (deviceTypes) {
                                self.deviceTypes = deviceTypes;

                                console
                                    .log(self.deviceTypes);

                                ConsoleService
                                    .instance()
                                    .getNode()
                                    .done(
                                    function (node) {
                                        self.node = Node
                                            .bind(
                                            self.deviceTypes,
                                            node);
                                        self
                                            .connectNode(node);
                                        self
                                            .pushPage(NodePage
                                                .create(
                                                this,
                                                node));
                                        jQuery.mobile
                                            .loading("hide");
                                    })
                                    .fail(
                                    function () {
                                        jQuery.mobile
                                            .loading("hide");
                                    });
                            })
                            .fail(
                            function () {
                                jQuery.mobile
                                    .loading("hide");
                            });
                    }).fail(function () {
                        jQuery.mobile.loading("hide");
                    });
            };

            /**
             *
             */
            MobileConsole.prototype.connectNode = function (node) {
                this.namespace = ConsoleService.instance().connectNode(
                    this.io, node);

                var self = this;

                this.namespace.on("connection", function (socket) {
                });
                this.namespace.on("disconnect", function (socket) {
                    self.node.state = "disconnected";

                    self.safeApply();
                });
                this.namespace.on("heartbeat", function (details) {
                    console.log("Receiving heartbeat");
                    console.log(details);

                    self.node.state = "running";
                    self.node.lastHeartbeat = new Date().getTime();

                    self.safeApply();
                });
                this.namespace.on("message", function (message) {
                    console.log("Receiving message");
                    console.log(message);
                });
                this.namespace
                    .on(
                    "event",
                    function (event) {
                        console.log("Receiving event");
                        console.log(event);
                        console.log(self.node.getDevice(
                            event.device).getSensor(
                            event.sensor).device);

                        self.node.getDevice(event.device)
                            .getSensor(event.sensor).value = event.value;
                        self.node.getDevice(event.device)
                            .getSensor(event.sensor).lastEventTimestamp = new Date()
                            .getTime();

                        if (event.type == "valueChange") {
                            console.log(event);
                            self.node.getDevice(event.device)
                                .getSensor(event.sensor).lastValueChangeTimestamp = new Date()
                                .getTime();

                            self.addValue(event.device,
                                event.sensor, event.value);

                            if (self.topPage().id == "sensorMonitoringPage"
                                && self.topPage().sensor.device.id == event.device
                                && self.topPage().sensor.id == event.sensor) {
                                self.topPage().updatePlot();
                            }
                        }

                        self.safeApply();
                    });
                this.namespace.on("deviceStateChange", function (deviceStateChange) {
                    self.onDeviceStateChanged(deviceStateChange);
                    self.safeApply();
                });
                this.namespace.on("actorStateChange", function (actorStateChange) {
                    self.onActorStateChanged(actorStateChange);
                    self.safeApply();
                });
            };

            /**
             *
             */
            MobileConsole.prototype.logout = function () {
                var self = this;

                jQuery.mobile.loading("show");

                ConsoleService.instance().logout().done(function () {
                    self.loggedInUser = null;

                    self.safeApply();
                    self.rootPage(self.loginPage);
                    jQuery.mobile.loading("hide");
                }).fail(function () {
                    jQuery.mobile.loading("hide");
                });
            };

            /**
             *
             */
            MobileConsole.prototype.pushGroupPage = function (group) {
                this.pushPage(GroupPage.create(this, group));
            };

            /**
             *
             */
            MobileConsole.prototype.pushDevicePage = function (device) {
                this.pushPage(DevicePage.create(this, device));
            };

            /**
             *
             */
            MobileConsole.prototype.pushActorPage = function (actor) {
                this.pushPage(ActorPage.create(this, actor));
            };

            /**
             *
             */
            MobileConsole.prototype.pushSensorPage = function (sensor) {
                this.pushPage(SensorPage.create(this, sensor));
            };

            /**
             *
             */
            MobileConsole.prototype.pushSensorMonitoringPage = function (sensor) {
                this.pushPage(SensorMonitoringPage.create(this, sensor));
            };

            /**
             *
             */
            MobileConsole.prototype.pushSensorValue = function (sensor) {
                console.log("===>");
                console.log(sensor);
                ConsoleService.instance().pushSensorValue(sensor).done(
                    function () {
                    }).fail(function (error) {
                        console.error(error);
                        // this.openInfoDialog("Cannot push Sensor Event.");
                    });
            };

            /**
             *
             */
            MobileConsole.prototype.pushSensorEvent = function (sensor,
                                                                event) {
                console.log("===>");
                console.log(sensor);

                var self = this;

                ConsoleService
                    .instance()
                    .pushSensorEvent(sensor, event)
                    .done(function () {
                    })
                    .fail(
                    function (error) {
                        console.error(error);
                        this
                            .openInfoDialog("Cannot push Sensor Event.");
                    });
            };

            /**
             *
             */
            MobileConsole.prototype.onDeviceStateChanged = function (stateChange) {
                var device = this.node.getDevice(stateChange.device);

                console.log(stateChange);

                device._state = stateChange.state;
                device.lastStateChangeTimestamp = new Date().getTime();
            };

            /**
             *
             */
            MobileConsole.prototype.onActorStateChanged = function (stateChange) {
                var actor = this.node.getDevice(stateChange.device)
                    .getActor(stateChange.actor);

                actor._state = stateChange.state;
                actor.lastStateChangeTimestamp = new Date().getTime();
            };

            /**
             *
             */
            MobileConsole.prototype.callNodeService = function (service) {
                jQuery.mobile.loading("show");

                ConsoleService.instance().callNodeService(service, {})
                    .done(function () {
                        jQuery.mobile.loading("hide");
                    }).fail(function () {
                        jQuery.mobile.loading("hide");
                    });
            };

            /**
             *
             */
            MobileConsole.prototype.callDeviceService = function (device, service) {
                jQuery.mobile.loading("show");

                ConsoleService.instance().callDeviceService(device, service, {})
                    .done(function () {
                        jQuery.mobile.loading("hide");
                    }).fail(function () {
                        jQuery.mobile.loading("hide");
                    });
            };

            /**
             *
             */
            MobileConsole.prototype.callActorService = function (actor,
                                                                 service, parameters) {
                jQuery.mobile.loading("show");

                console.log(actor.id + " " + service);
                ConsoleService.instance().callActorService(actor, service,
                    parameters).done(function () {
                        jQuery.mobile.loading("hide");
                    }).fail(function () {
                        jQuery.mobile.loading("hide");
                    });
            };

            /*
             *
             */
            MobileConsole.prototype.getComponentPluginPath = function (component) {
                return ConsoleService.instance().getComponentPluginPath(
                    component);
            };

            /**
             *
             */
            MobileConsole.prototype.pushDataPage = function (data) {
                this.pushPage(DataPage.create(this, data));
            };

            /**
             *
             */
            MobileConsole.prototype.addValue = function (device, sensor,
                                                         value) {
                if (!this.sensorPlotData[device]
                    || !this.sensorPlotData[device][sensor]) {
                    return;
                }

                var plotData = this.sensorPlotData[device][sensor];
                var now = new Date().getTime()

                while (plotData.series[0][0] < now - plotData.interval) {
                    plotData.series.shift();
                }

                plotData.series.push([now, value]);
            };

            /**
             *
             */
            MobileConsole.prototype.formatDateTime = function (time) {
                return Utils.formatDateTime(time);
            };

            /*
             *
             */
            MobileConsole.prototype.safeApply = function (fn) {
                var phase = this.$root.$$phase;

                if (phase == '$apply' || phase == '$digest') {
                    if (fn && (typeof (fn) === 'function')) {
                        fn();
                    }
                } else {
                    this.$apply(fn);
                }
            };
        }
    });
