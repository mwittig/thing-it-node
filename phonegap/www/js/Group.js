/*******************************************************************************
 * Copyright (c) 2014-2015 Marc Gille. All rights reserved.
 ******************************************************************************/

define(
    ["js/Utils", "js/Node"],
    function (Utils, Node) {
        return {
            bind: function (node, group, superGroup) {
                Utils.inheritMethods(group, new Group());

                group.bind(node, superGroup);

                return group;
            }
        };

        function Group() {
            /**
             *
             */
            Group.prototype.bind = function (node, superGroup) {
                this.__node = node;
                this.__superGroup = superGroup;

                for (n in this.subGroups) {
                    Utils.inheritMethods(this.subGroups[n], new Group());

                    this.subGroups[n].__superGroup = this;

                    this.subGroups[n].bind(node);
                }

                this.__devices = [];

                for (var n in this.devices) {
                    this.__devices.push(node.getDevice(this.devices[n]));
                }

                this.__actors = [];

                for (var n in this.actors) {
                    var path = this.actors[n].split(".");

                    this.__actors.push(node.getDevice(path[0]).getActor(
                        path[1]));
                }

                this.__sensors = [];

                for (var n in this.sensors) {
                    var path = this.sensors[n].split(".");

                    this.__sensors.push(node.getDevice(path[0]).getSensor(
                        path[1]));
                }

                if (!this.services) {
                    this.services = [];
                }

                this.__services = [];

                for (n in this.services) {
                    this.__services.push(node.getService(this.services[n]));
                }
            };

            /**
             *
             */
            Group.prototype.getAllGroups = function () {
                var groups = [];

                for (var n in this.subGroups) {
                    groups.push.apply(groups, this.subGroups[n]
                        .getAllGroups());
                    groups.push(this.subGroups[n]);
                }

                return groups;
            };

            /**
             *
             */
            Group.prototype.containsDevice = function (device) {
                for (var n in this.__devices) {
                    if (this.__devices[n] == device) {
                        return true;
                    }
                }

                for (var n = 0; n < this.subGroups.length; ++n) {
                    if (this.subGroups[n].containsDevice(device)) {
                        return true;
                    }
                }

                return false;
            };

            /**
             *
             */
            Group.prototype.containsSensor = function (sensor) {
                for (var n in this.__sensors) {
                    if (this.__sensors[n] == sensor) {
                        return true;
                    }
                }

                for (var n = 0; n < this.subGroups.length; ++n) {
                    if (this.subGroups[n].containsSensor(sensor)) {
                        return true;
                    }
                }

                return false;
            };

            /**
             *
             */
            Group.prototype.getDevices = function () {
                return this.__devices;
            };

            /**
             *
             */
            Group.prototype.getSensors = function () {
                return this.__sensors;
            };

            /**
             *
             */
            Group.prototype.containsActor = function (actor) {
                for (var n in this.__actors) {
                    if (this.__actors[n] == actor) {
                        return true;
                    }
                }

                for (var n = 0; n < this.subGroups.length; ++n) {
                    if (this.subGroups[n].containsActor(actor)) {
                        return true;
                    }
                }

                return false;
            };

            /**
             *
             */
            Group.prototype.getActors = function () {
                return this.__actors;
            };

            /**
             *
             */
            Group.prototype.getServices = function () {
                var services = [];

                for (var id in this.services) {
                    services.push(this.services[id].__service);
                }

                return services;
            };
        }
    });