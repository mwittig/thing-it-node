/*******************************************************************************
 * Copyright (c) 2014-2015 Marc Gille. All rights reserved.
 ******************************************************************************/

define(
    ["js/Utils", "js/Node", "js/ConsoleService",
        "js/LoginPage", "js/MeshesPage", "js/MeshPage", "js/NodePage",
        "js/GroupPage", "js/DevicePage", "js/ActorPage",
        "js/SensorPage", "js/DataPage",
        "js/DeviceMonitoringPage",
        "js/SensorMonitoringPage"],
    function (Utils, Node, ConsoleService, LoginPage, MeshesPage, MeshPage, NodePage, GroupPage, DevicePage,
              ActorPage, SensorPage, DataPage, DeviceMonitoringPage, SensorMonitoringPage) {
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
                this.plotData = {};

                ConsoleService
                    .instance()
                    .getAuthenticationMode()
                    .done(
                    function (authenticationMode) {
                        this.authenticationMode = authenticationMode;

                        if (this.authenticationMode.type == "none") {
                            this.login();
                        }
                        else {
                            this.pageStack.push(this.loginPage = LoginPage.create(this));

                            this.showPage(this.loginPage);
                        }

                        window.setTimeout(function () {
                            this.deviceAdvertisementDialog = {
                                dialog: jQuery("#deviceAdvertisementDialog").popup()
                            };
                        }.bind(this), 1000);
                    }.bind(this)).fail(function () {
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
                    // self.safeApply();
                });

                var self = this;

                promise.done(function () {
                    self.safeApply();

                    window.setTimeout(function () {
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
            MobileConsole.prototype.openDeviceAdvertisementDialog = function () {
                jQuery("#deviceAdvertisementDialog").popup("open");
            };

            /**
             *
             */
            MobileConsole.prototype.closeDeviceAdvertisementDialog = function () {
                jQuery("#deviceAdvertisementDialog").popup("close");
            };

            /**
             *
             */
            MobileConsole.prototype.registerDevice = function () {
                jQuery.mobile.loading("show");

                console.log("Start registration");
                ConsoleService.instance().registerDevice(this.node, this.deviceAdvertisementDialog.device).done(function (node) {
                    console.log("Changed Node");
                    console.log(node);

                    if (ConsoleService.instance().proxyMode == "local") {
                        this
                            .pushNodePage(
                            node);
                        this.safeApply();
                        jQuery.mobile
                            .loading("hide");
                        this.closeDeviceAdvertisementDialog();
                    }
                    else {
                        // TODO
                        jQuery.mobile
                            .loading("hide");
                        this.closeDeviceAdvertisementDialog();
                    }

                }.bind(this)).fail(function () {
                    jQuery.mobile.loading("hide");
                });
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

                                if (ConsoleService.instance().proxyMode == "local") {
                                    ConsoleService
                                        .instance()
                                        .getNode()
                                        .done(
                                        function (node) {
                                            self
                                                .pushNodePage(
                                                node);
                                            jQuery.mobile
                                                .loading("hide");
                                        })
                                        .fail(
                                        function () {
                                            jQuery.mobile
                                                .loading("hide");
                                        });
                                }
                                else {
                                    self
                                        .pushMeshesPage();
                                }
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

                        if (event.sensor) {
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

                                if (event.sensor) {
                                    self.addValue(event.device,
                                        event.sensor, event.value);
                                } else {
                                    self.writeToDeviceStream(event.device,
                                        event.value);
                                }

                                if (self.topPage().id == "sensorMonitoringPage"
                                    && self.topPage().sensor.device.id == event.device
                                    && self.topPage().sensor.id == event.sensor) {
                                    self.topPage().updatePlot();
                                }
                            }
                        }
                        else {
                            var device = self.node.getDevice(event.device);

                            console.log("Trigger event:");
                            console.log(JSON.stringify(event));

                            window.postMessage(JSON.stringify(event), window.location.href);
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
                this.namespace.on("deviceAdvertisement", function (device) {
                    console.log("Device advertisement ");
                    console.log(device);
                    this.onDeviceAdvertisement(device);
                }.bind(this));
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
            MobileConsole.prototype.pushMeshesPage = function () {
                this.pushPage(MeshesPage.create(this));
            };

            /**
             *
             */
            MobileConsole.prototype.pushMeshPage = function (mesh) {
                this.pushPage(MeshPage.create(this, mesh));
            };

            /**
             *
             */
            MobileConsole.prototype.openNodePage = function (mesh, node) {
                ConsoleService
                    .instance()
                    .getNode(mesh, node)
                    .done(
                    function (node) {
                        this.pushNodePage(node);
                    }.bind(this));
            };
            /**
             *
             */
            MobileConsole.prototype.pushNodePage = function (node) {
                this.node = Node
                    .bind(
                    this.deviceTypes,
                    node);

                this
                    .connectNode(this.node);
                this.pushPage(NodePage.create(this, node));
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
            MobileConsole.prototype.pushDeviceMonitoringPage = function (device) {
                this.pushPage(DeviceMonitoringPage.create(this, device));
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
            MobileConsole.prototype.pushDataPage = function (data) {
                this.pushPage(DataPage.create(this, data));
            };

            /**
             *
             */
            MobileConsole.prototype.pushSensorValue = function (sensor) {
                ConsoleService.instance().pushSensorValue(this.node, sensor).done(
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
                var self = this;

                ConsoleService
                    .instance()
                    .pushSensorEvent(this.node, sensor, event)
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
                try {
                    var device = this.node.getDevice(stateChange.device);

                    device._state = stateChange.state;
                    device.lastStateChangeTimestamp = new Date().getTime();

                    this.addDeviceState(device, stateChange.state);

                    if (this.topPage().id == "deviceMonitoringPage"
                        && this.topPage().device == device) {
                        this.topPage().updatePlots();
                    }

                }
                catch (error) {
                    console.log(error);

                    // Device may not be registered yet and is already firing updates
                }
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

                console.log("Call Node Service");
                console.log(this.node);

                ConsoleService.instance().callNodeService(this.node, service, {})
                    .done(function () {
                        jQuery.mobile.loading("hide");
                    }).fail(function () {
                        jQuery.mobile.loading("hide");
                    });
            };

            /**
             *
             */
            MobileConsole.prototype.onDeviceAdvertisement = function (device) {
                this.deviceAdvertisementDialog.device = device;

                this.safeApply();

                this.openDeviceAdvertisementDialog();
            };

            /**
             *
             */
            MobileConsole.prototype.callDeviceService = function (device, service) {
                jQuery.mobile.loading("show");

                ConsoleService.instance().callDeviceService(this.node, device, service, {})
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

                ConsoleService.instance().callActorService(this.node, actor, service,
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
            MobileConsole.prototype.addDeviceState = function (device,
                                                               state) {
                if (!this.plotData[device.id]) {
                    return;
                }

                for (var n in device.__type.state) {
                    var field = device.__type.state[n];

                    if (field.type.id != "number") {
                        continue;
                    }

                    var plotData = this.plotData[device.id][field.id];
                    var now = new Date().getTime()

                    while (plotData.series[0][0] < now - plotData.interval) {
                        plotData.series.shift();
                    }

                    plotData.series.push([now, state[field.id]]);
                }
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
            MobileConsole.prototype.writeToDeviceStream = function (device,
                                                                    value) {
            };

            /**
             *
             */
            MobileConsole.prototype.formatDateTime = function (time) {
                return Utils.formatDateTime(time);
            };

            /**
             *
             */
            MobileConsole.prototype.formatDecimal = function (decimal) {
                return Utils.formatDecimal(decimal);
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
