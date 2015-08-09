/*******************************************************************************
 * Copyright (c) 2014-2015 Marc Gille. All rights reserved.
 ******************************************************************************/

define(["js/Utils", "js/Actor", "js/Sensor"],
    function (Utils, Actor, Sensor) {
        return {
            bind: function (deviceTypes, node, device) {
                Utils.inheritMethods(device, new Device());

                device.__node = node;

                device.bind(deviceTypes);

                return device;
            }
        };

        /**
         *
         */
        function Device() {
            /**
             *
             */
            Device.prototype.bind = function (deviceTypes) {
                this.class = "Device";
                this.__type = deviceTypes[this.plugin];

                for (var n = 0; n < this.actors.length; n++) {
                    Actor.bind(this, this.actors[n]);
                }

                for (var n = 0; n < this.sensors.length; n++) {
                    Sensor.bind(this, this.sensors[n]);
                }
            };

            /**
             *
             */
            Device.prototype.getActorType = function (plugin) {
                for (var n = 0; n < this.__type.actorTypes.length; ++n) {
                    if (this.__type.actorTypes[n].plugin === plugin) {
                        return this.__type.actorTypes[n];
                    }
                }

                throw "No actor type with Plugin ID " + plugin;
            };

            /**
             *
             */
            Device.prototype.getSensorType = function (plugin) {
                for (var n = 0; n < this.__type.sensorTypes.length; ++n) {
                    if (this.__type.sensorTypes[n].plugin === plugin) {
                        return this.__type.sensorTypes[n];
                    }
                }

                throw "No sensor type with Plugin ID " + plugin;
            };

            /**
             *
             */
            Device.prototype.getActor = function (id) {
                for (var n in this.actors) {
                    if (this.actors[n].id === id) {
                        return this.actors[n];
                    }
                }

                throw "Cannot find Actor [" + id + "].";
            };

            /**
             *
             */
            Device.prototype.getSensor = function (id) {
                for (var n in this.sensors) {
                    if (this.sensors[n].id === id) {
                        return this.sensors[n];
                    }
                }

                throw "Cannot find Sensor [" + id + "].";
            };

            /**
             *
             */
            Device.prototype.getContextObject = function (label) {
                for (var n in this.__type.services) {
                    if (this.__type.services[n].label.toLowerCase() === label.toLowerCase()) {

                        // TODO Trick, we do not have a Service class

                        this.__type.services[n].class = "Service";

                        return this.__type.services[n];
                    }
                }

                // TODO Add Actors and Sensors

                return null;
            };
        }
    });