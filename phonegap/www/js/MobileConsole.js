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
            MobileConsole.prototype.console = function () {
                return this;
            };

            /**
             *
             */
            MobileConsole.prototype.initialize = function (io, location) {
                this.location = location;
                this.io = io;
                this.pageStack = [];
                this.sensorPlotData = {};
                this.plotData = {};
                this.deviceAdvertisementDialog = {};
                this.Ui.initialize(this, "deviceAdvertisementDialog");
                this.userCreationDialog = {};
                this.Ui.initialize(this, "userCreationDialog");
                this.messageDialog = {};
                this.Ui.initialize(this, "messageDialog");

                ConsoleService
                    .instance()
                    .getSettings()
                    .done(
                    function (settings) {
                        this.settings = settings;

                        if (this.settings.authentication == "none") {
                            this.login();
                        }
                        else {
                            this.pageStack.push(this.loginPage = LoginPage.create(this));

                            this.showPage(this.loginPage);
                        }
                    }.bind(this)).fail(function (error) {
                        this
                            .openMessageDialog(error, "error");
                    }.bind(this));
            };

            /**
             *
             */
            MobileConsole.prototype.showPage = function (page, object) {
                try {
                    this.location.path('/' + page.id);

                    var promise;

                    if (object) {
                        promise = page.show(object);
                    } else {
                        promise = page.show();
                    }

                    promise.done(function () {
                        this.safeApply(function () {
                        }.bind(this));
                    }.bind(this)).fail(function (error) {
                        console.trace(error);

                        this
                            .openMessageDialog(error, "error");
                    });
                }
                catch (error) {
                    console.trace(error);

                    this
                        .openMessageDialog(error, "error");
                }
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

                                if (!this.settings.server || this.settings.server == "local") {
                                    ConsoleService
                                        .instance()
                                        .getNode(this.deviceTypes)
                                        .done(
                                        function (node) {
                                            this.loggedInUser = User.bind(node, loggedInUser);

                                            console.log("Node 1 ==> ", node);
                                            console.log("Logged-In User ===>", this.loggedInUser);

                                            this
                                                .pushNodePage(
                                                node);
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
                                console.trace(error);

                                this
                                    .openMessageDialog(error, "error");
                            }.bind(this));
                    }.bind(this)).fail(function (error) {
                        console.trace(error);

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

                this.namespace.on("connection", function (socket) {
                }.bind(this));
                this.namespace.on("disconnect", function (socket) {
                    this.safeApply(function () {
                        node.state = "disconnected";
                    }.bind(this));
                }.bind(this));
                this.namespace.on("heartbeat", function (details) {
                    this.safeApply(function () {
                        node.state = "running";
                        node.lastHeartbeat = new Date().getTime();

                    }.bind(this));
                }.bind(this));
                this.namespace.on("message", function (message) {
                    console.log("Receiving message");
                    console.log(message);
                }.bind(this));
                this.namespace
                    .on(
                    "event",
                    function (event) {
                        console.log("Receiving event");
                        console.log(event);

                        if (event.sensor) {
                            console.log(node.getDevice(
                                event.device).getSensor(
                                event.sensor).device);

                            node.getDevice(event.device)
                                .getSensor(event.sensor).value = event.value;
                            node.getDevice(event.device)
                                .getSensor(event.sensor).lastEventTimestamp = new Date()
                                .getTime();

                            if (event.type == "valueChange") {
                                console.log(event);
                                node.getDevice(event.device)
                                    .getSensor(event.sensor).lastValueChangeTimestamp = new Date()
                                    .getTime();

                                if (event.sensor) {
                                    this.addValue(event.device,
                                        event.sensor, event.value);
                                } else {
                                    this.writeToDeviceStream(event.device,
                                        event.value);
                                }

                                if (this.topPage().id == "sensorMonitoringPage"
                                    && this.topPage().sensor.device.id == event.device
                                    && this.topPage().sensor.id == event.sensor) {
                                    this.topPage().updatePlot();
                                }
                            }
                        }
                        else {
                            var device = node.getDevice(event.device);

                            console.log("Trigger event:");
                            console.log(JSON.stringify(event));

                            window.postMessage(JSON.stringify(event), window.location.href);
                        }

                        this.safeApply();
                    }.bind(this));
                this.namespace.on("deviceStateChange", function (deviceStateChange) {
                    this.safeApply(function () {
                        this.onDeviceStateChanged(deviceStateChange);
                    }.bind(this));
                }.bind(this));
                this.namespace.on("actorStateChange", function (actorStateChange) {
                    console.log("Receiving Actor State Change");
                    this.safeApply(function () {
                        this.onActorStateChanged(actorStateChange);
                    }.bind(this));
                }.bind(this));
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
                    .getNode(this.deviceTypes, mesh, node)
                    .done(
                    function (node) {
                        this.pushNodePage(node);
                    }.bind(this));
            };

            /**
             *
             */
            MobileConsole.prototype.pushNodePage = function (node) {
                this.pushPage(NodePage.create(this, node));
            };

            /**
             *
             */
            MobileConsole.prototype.pushHomePage = function () {
                if (this.settings.server === 'local') {
                    this.rootPage(NodePage.create(this, this.node));
                }
                else {
                    this.rootPage(MeshesPage.create(this));
                }
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
            MobileConsole.prototype.openMessageDialog = function (message, type) {
                this.messageDialog.message = message;
                this.messageDialog.type = type;

                this.Ui.turnOn("messageDialog");

                this.safeApply();
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
            MobileConsole.prototype.isDeviceInGroups = function (node, device) {
                for (var n in node.groups) {
                    if (node.groups[n].containsDevice(device)) {
                        return true;
                    }
                }

                return false;
            };

            /**
             *
             */
            MobileConsole.prototype.isActorInGroups = function (node, actor) {
                for (var n in node.groups) {
                    if (node.groups[n].containsActor(actor)) {
                        return true;
                    }
                }

                return false;
            };

            /**
             *
             */
            MobileConsole.prototype.isSensorInGroups = function (node, sensor) {
                for (var n in node.groups) {
                    if (node.groups[n].containsSensor(sensor)) {
                        return true;
                    }
                }

                return false;
            };

            /**
             *
             */
            MobileConsole.prototype.pushSensorValue = function (sensor) {
                ConsoleService.instance().pushSensorValue(sensor).done(
                    function () {
                    }).fail(function (error) {
                        console.trace(error);

                        this.openMessageDialog("Cannot push Sensor Event.");
                    }.bind(this));
            };

            /**
             *
             */
            MobileConsole.prototype.pushSensorEvent = function (sensor,
                                                                event) {
                var self = this;

                ConsoleService
                    .instance()
                    .pushSensorEvent(sensor, event)
                    .done(function () {
                    })
                    .fail(
                    function (error) {
                        console.trace(error);

                        this
                            .openMessageDialog(error, "error");
                    }.bind(this));
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
            MobileConsole.prototype.onDeviceAdvertisement = function (device) {
                this.deviceAdvertisementDialog.device = device;

                this.safeApply();
                this.openDeviceAdvertisementDialog();
            };

            /**
             *
             */
            MobileConsole.prototype.callNodeService = function (node, service) {
                ConsoleService.instance().callNodeService(node, service, {})
                    .done(function () {
                    }).fail(function (error) {
                        this
                            .openMessageDialog(error, "error");
                    }.bind(this));
            };

            /**
             *
             */
            MobileConsole.prototype.callDeviceService = function (device, service) {
                ConsoleService.instance().callDeviceService(device, service, {})
                    .done(function () {
                    }).fail(function (error) {
                        console.trace(error);

                        this
                            .openMessageDialog(error, "error");
                    }.bind(this));
            };

            /**
             *
             */
            MobileConsole.prototype.callActorService = function (actor,
                                                                 service, parameters) {
                ConsoleService.instance().callActorService(actor, service,
                    parameters).done(function () {
                    }).fail(function (error) {
                        console.trace(error);

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

            /*
             *
             */
            MobileConsole.prototype.getComponentPluginDirectory = function (component) {
                return ConsoleService.instance().getComponentPluginDirectory(
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
                if (this.rootScope && (this.rootScope.$$phase == "$apply" || this.rootScope.$$phase == "$digest")) {
                    if (fn && (typeof (fn) === 'function')) {
                        fn();
                    }
                } else {
                    this.rootScope.$apply(fn);
                }
            };
        }
    });
