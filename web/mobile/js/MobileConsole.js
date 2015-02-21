/*******************************************************************************
 * Copyright (c) 2014-2015 Marc Gille. All rights reserved.
 ******************************************************************************/

define(
		[ "mobile/js/Utils", "mobile/js/Node", "mobile/js/ConsoleService",
				"mobile/js/LoginPage", "mobile/js/NodePage",
				"mobile/js/GroupPage", "mobile/js/ActorPage",
				"mobile/js/SensorPage", "mobile/js/DataPage" ],
		function(Utils, Node, ConsoleService, LoginPage, NodePage, GroupPage,
				ActorPage, SensorPage, DataPage) {
			return {
				create : function() {
					return new MobileConsole();
				}
			};

			function MobileConsole() {
				/**
				 * 
				 */
				MobileConsole.prototype.initialize = function(io) {
					this.io = io;
					this.pageStack = [ this.loginPage = LoginPage.create(this) ];

					this.showPage(this.loginPage);
				};

				/**
				 * 
				 */
				MobileConsole.prototype.showPage = function(page, object) {
					var self = this;

					var promise;

					if (object) {
						promise = page.show(object);
					} else {
						promise = page.show();
					}

					self.safeApply();

					promise.done(function() {
						self.safeApply();

						window.setTimeout(function() {
							jQuery.mobile.changePage("#" + page.id);
						}, 200);
					}).fail(function(error) {
						console.error(error);
					});
				};

				/**
				 * 
				 */
				MobileConsole.prototype.topPage = function() {
					if (this.pageStack.length) {
						return this.pageStack[this.pageStack.length - 1];
					}

					return null;
				};

				/**
				 * 
				 */
				MobileConsole.prototype.pushPage = function(page) {
					if (this.topPage()) {
						this.topPage().leave();
					}

					this.pageStack.push(page);
					this.showPage(page);
				};

				/**
				 * 
				 */
				MobileConsole.prototype.popPage = function() {
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
				MobileConsole.prototype.rootPage = function(page) {
					if (this.topPage()) {
						this.pageStack.pop().leave();
					}

					this.pageStack = [ page ];

					this.showPage(page);
				};

				/**
				 * 
				 */
				MobileConsole.prototype.login = function() {
					var self = this;

					jQuery.mobile.loading("show");

					ConsoleService
							.instance()
							.login(this.loginPage.account,
									this.loginPage.password)
							.done(
									function(loggedInUser) {
										self.loggedInUser = loggedInUser;

										ConsoleService
												.instance()
												.getDeviceTypes()
												.done(
														function(deviceTypes) {
															self.deviceTypes = deviceTypes;

															console
																	.log(self.deviceTypes);

															ConsoleService
																	.instance()
																	.getNode()
																	.done(
																			function(
																					node) {
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
																			function() {
																				jQuery.mobile
																						.loading("hide");
																			});
														})
												.fail(
														function() {
															jQuery.mobile
																	.loading("hide");
														});
									}).fail(function() {
								jQuery.mobile.loading("hide");
							});
				}

				/**
				 * 
				 */
				MobileConsole.prototype.connectNode = function(node) {
					this.namespace = ConsoleService.instance().connectNode(
							this.io, node);

					var self = this;

					this.namespace.on("connection", function(socket) {
						console.log("Websocket connection was established.");
					});
					this.namespace.on("disconnect", function(socket) {
						console.log("Websocket connection was disconnected.");

						self.node.state = "disconnected";

						self.safeApply();
					});
					this.namespace.on("heartbeat", function(details) {
						console.log("Receiving heartbeat");
						console.log(details);

						self.node.state = "running";
						self.node.lastHeartbeat = new Date().getTime();

						self.safeApply();
					});
					this.namespace.on("message", function(message) {
						console.log("Receiving message");
						console.log(message);
					});
					this.namespace
							.on(
									"event",
									function(event) {
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
											self.node.getDevice(event.device)
													.getSensor(event.sensor).lastValueChangeTimestamp = new Date()
													.getTime();
										}

										self.safeApply();
									});
					this.namespace.on("actorStateChange", function(
							actorStateChange) {
						self.onActorStateChanged(actorStateChange);
						self.safeApply();
					});
				};

				/**
				 * 
				 */
				MobileConsole.prototype.logout = function() {
					var self = this;

					jQuery.mobile.loading("show");

					ConsoleService.instance().logout().done(function() {
						self.loggedInUser = null;

						self.safeApply();
						self.rootPage(self.loginPage);
						jQuery.mobile.loading("hide");
					}).fail(function() {
						jQuery.mobile.loading("hide");
					});
				};

				/**
				 * 
				 */
				MobileConsole.prototype.pushGroupPage = function(group) {
					this.pushPage(GroupPage.create(this, group));
				};

				/**
				 * 
				 */
				MobileConsole.prototype.pushActorPage = function(actor) {
					this.pushPage(ActorPage.create(this, actor));
				};

				/**
				 * 
				 */
				MobileConsole.prototype.pushSensorPage = function(sensor) {
					this.pushPage(SensorPage.create(this, sensor));
				};

				/**
				 * 
				 */
				MobileConsole.prototype.pushSensorValue = function(sensor) {
					console.log("===>");
					console.log(sensor);
					ConsoleService.instance().pushSensorValue(sensor).done(
							function() {
							}).fail(function() {
						this.openInfoDialog("Cannot push Sensor Event.");
					});
				};

				/**
				 * 
				 */
				MobileConsole.prototype.pushSensorEvent = function(sensor,
						event) {
					console.log("===>");
					console.log(sensor);

					var self = this;

					ConsoleService
							.instance()
							.pushSensorEvent(sensor, event)
							.done(function() {
							})
							.fail(
									function() {
										this
												.openInfoDialog("Cannot push Sensor Event.");
									});
				};

				/**
				 * 
				 */
				MobileConsole.prototype.onActorStateChanged = function(
						stateChange) {
					var actor = this.node.getDevice(stateChange.device)
							.getActor(stateChange.actor);

					actor.state = stateChange.state;
					actor.lastStateChangeTimestamp = new Date().getTime();

					console.log("Actor");
					console.log(actor);
				};

				/*
				 * 
				 */
				MobileConsole.prototype.getComponentPluginPath = function(
						component) {
					return ConsoleService.instance().getComponentPluginPath(
							component);
				};

				/**
				 * 
				 */
				MobileConsole.prototype.pushDataPage = function(data) {
					this.pushPage(DataPage.create(this, data));
				};

				/**
				 * 
				 */
				MobileConsole.prototype.formatDateTime = function(time) {
					return Utils.formatDateTime(time);
				};

				/*
				 * 
				 */
				MobileConsole.prototype.safeApply = function(fn) {
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
