/*******************************************************************************
 * Copyright (c) 2014-2015 Marc Gille. All rights reserved.
 ******************************************************************************/

define(
    ["js/Utils", "js/Node", "js/User", "js/ConsoleService",
        "js/LoginPage", "js/MeshesPage", "js/MeshPage", "js/NodePage",
        "js/GroupPage", "js/DevicePage", "js/ActorPage",
        "js/SensorPage", "js/DataPage",
        "js/DeviceMonitoringPage",
        "js/SensorMonitoringPage",
        "js/UserManagementPage",
        "js/UserPage"],
    function (Utils, Node, User, ConsoleService, LoginPage, MeshesPage, MeshPage, NodePage, GroupPage, DevicePage,
              ActorPage, SensorPage, DataPage, DeviceMonitoringPage, SensorMonitoringPage, UserManagementPage, UserPage) {
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
            MobileConsole.prototype.initialize = function (io, location) {
                this.location = location;
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

                        this.deviceAdvertisementDialog = {};
                        this.Ui.initialize(this, "deviceAdvertisementDialog");
                        this.userCreationDialog = {};
                        this.Ui.initialize(this, "userCreationDialog");
                        this.messageDialog = {};
                        this.Ui.initialize(this, "messageDialog");
                    }.bind(this)).fail(function (error) {
                        this
                            .openMessageDialog(error, "error");
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

                promise.done(function () {
                    this.location.path('/' + page.id);
                    this.safeApply();
                    console.log("Pushed Page: " + page.id);
                }.bind(this)).fail(function (error) {
                    this
                        .openMessageDialog(error, "error");
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
                this.Ui.turnOn("deviceAdvertisementDialog");
            };

            /**
             *
             */
            MobileConsole.prototype.closeDeviceAdvertisementDialog = function () {
                this.Ui.turnOff("deviceAdvertisementDialog");
            };

            /**
             *
             */
            MobileConsole.prototype.registerDevice = function () {
                ConsoleService.instance().registerDevice(this.node, this.deviceAdvertisementDialog.device).done(function (node) {
                    if (ConsoleService.instance().proxyMode == "local") {
                        this
                            .pushNodePage(
                            node);
                        this.safeApply();
                        this.closeDeviceAdvertisementDialog();
                    }
                    else {
                        // TODO
                        this.closeDeviceAdvertisementDialog();
                    }
                }.bind(this)).fail(function (error) {
                    this
                        .openMessageDialog(error, "error");
                }.bind(this));
            };

            /**
             *
             */
            MobileConsole.prototype.login = function (credentials) {
                ConsoleService
                    .instance()
                    .login(credentials)
                    .done(
                    function (loggedInUser) {
                        ConsoleService
                            .instance()
                            .getDeviceTypes()
                            .done(
                            function (deviceTypes) {
                                this.deviceTypes = deviceTypes;

                                if (ConsoleService.instance().proxyMode == "local") {
                                    ConsoleService
                                        .instance()
                                        .getNode()
                                        .done(
                                        function (node) {
                                            this
                                                .pushNodePage(
                                                node);
                                            this.loggedInUser = User.bind(node, loggedInUser);

                                            console.log("Logged-In User ===>", this.loggedInUser);
                                        }.bind(this))
                                        .fail(function (error) {
                                            this
                                                .openMessageDialog(error, "error");
                                        }.bind(this));
                                }
                                else {
                                    this
                                        .pushMeshesPage();
                                }
                            }.bind(this))
                            .fail(function (error) {
                                this
                                    .openMessageDialog(error, "error");
                            }.bind(this));
                    }.bind(this)).fail(function (error) {
                        this
                            .openMessageDialog(error, "error");
                    }.bind(this));
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
                ConsoleService.instance().logout().done(function () {
                    this.loggedInUser = null;

                    this.safeApply();
                    this.rootPage(this.loginPage);
                }.bind(this)).fail(function (error) {
                    this
                        .openMessageDialog(error, "error");
                }.bind(this));
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
            MobileConsole.prototype.pushHomePage = function () {
                this.rootPage(NodePage.create(this, this.node));
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
            MobileConsole.prototype.pushUserManagementPage = function () {
                this.pushPage(UserManagementPage.create(this));
            };

            /**
             *
             */
            MobileConsole.prototype.pushUserPage = function (user) {
                this.pushPage(UserPage.create(this, user));
            };

            /**
             *
             */
            MobileConsole.prototype.openUserCreationDialog = function () {
                this.userCreationDialog.user = {};
            };

            /**
             *
             */
            MobileConsole.prototype.createUser = function () {
                ConsoleService.instance().createUser(this.node, this.userCreationDialog.user).done(function () {
                    this.openMessageDialog("User created");
                }.bind(this)).fail(function (error) {
                    this.openMessageDialog(error);
                }.bind(this));
            };

            /**
             *
             */
            MobileConsole.prototype.isDeviceInGroups = function (device) {
                for (var n in this.node.groups) {
                    if (this.node.groups[n].containsDevice(device)) {
                        return true;
                    }
                }

                return false;
            };

            /**
             *
             */
            MobileConsole.prototype.openMessageDialog = function (message, type) {
                this.messageDialog.message = message;
                this.messageDialog.type = type;

                this.Ui.turnOn("messageDialog");
            };

            /**
             *
             */
            MobileConsole.prototype.isActorInGroups = function (actor) {
                for (var n in this.node.groups) {
                    if (this.node.groups[n].containsActor(actor)) {
                        return true;
                    }
                }

                return false;
            };

            /**
             *
             */
            MobileConsole.prototype.isSensorInGroups = function (sensor) {
                for (var n in this.node.groups) {
                    if (this.node.groups[n].containsSensor(sensor)) {
                        return true;
                    }
                }

                return false;
            };

            /**
             *
             */
            MobileConsole.prototype.pushSensorValue = function (sensor) {
                ConsoleService.instance().pushSensorValue(this.node, sensor).done(
                    function () {
                    }).fail(function (error) {
                        this.openMessageDialog("Cannot push Sensor Event.");
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
                        this
                            .openMessageDialog(error, "error");
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
                ConsoleService.instance().callNodeService(this.node, service, {})
                    .done(function () {
                    }).fail(function (error) {
                        this
                            .openMessageDialog(error, "error");
                    }.bind(this));
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
                ConsoleService.instance().callDeviceService(this.node, device, service, {})
                    .done(function () {
                    }).fail(function (error) {
                        this
                            .openMessageDialog(error, "error");
                    }.bind(this));
            };

            /**
             *
             */
            MobileConsole.prototype.callActorService = function (actor,
                                                                 service, parameters) {
                ConsoleService.instance().callActorService(this.node, actor, service,
                    parameters).done(function () {
                    }).fail(function (error) {
                        this
                            .openMessageDialog(error, "error");
                    }.bind(this));
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
            MobileConsole.prototype.loggedInUserIsAdministrator = function (time) {
                if (!this.loggedInUser) {
                    return false;
                }

                return this.loggedInUser.hasRole("administrator");
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
