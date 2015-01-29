/*******************************************************************************
 * Copyright (c) 2014-2015 Marc Gille. All rights reserved.
 ******************************************************************************/

define([ "mobile/js/Utils", "mobile/js/Node" ], function(Utils, Node) {
	return {
		bind : function(node, group, superGroup) {
			Utils.inheritMethods(group, new Group());

			group.bind(node, superGroup);

			return group;
		}
	};

	function Group() {
		/**
		 * 
		 */
		Group.prototype.bind = function(node, superGroup) {
			this.__node = node;
			this.__superGroup = superGroup;

			for (n in this.subGroups) {
				Utils.inheritMethods(this.subGroups[n], new Group());

				this.subGroups[n].__superGroup = this;

				this.subGroups[n].bind(node, this);
			}

			for (key in this.actors) {
				var path = key.split(".");

				this.actors[key].__actor = node.getDevice(path[0]).getActor(
						path[1]);
			}

			for (key in this.sensors) {
				var path = key.split(".");

				this.sensors[key].__sensor = node.getDevice(path[0]).getSensor(
						path[1]);
			}

			if (!this.services) {
				this.services = {};
			} else {
				for (key in this.services) {
					this.services[key].__service = node.getService(key);
				}
			}

			if (!this.eventProcessors) {
				this.eventProcessors = [];
			}
		};

		/**
		 * 
		 */
		Group.prototype.getAllGroups = function() {
			var groups = [];

			for ( var n in this.subGroups) {
				groups.push.apply(groups, this.subGroups[n].getAllGroups());
				groups.push(this.subGroups[n]);
			}

			return groups;
		};

		/**
		 * 
		 */
		Group.prototype.containsSensor = function(sensor) {
			if (this.sensors[sensor.__device.id + "." + sensor.id]) {
				return true;
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
		Group.prototype.getSensors = function() {
			var sensors = [];

			for ( var id in this.sensors) {
				sensors.push(this.sensors[id].__sensor);
			}

			return sensors;
		};

		/**
		 * 
		 */
		Group.prototype.containsActor = function(actor) {
			if (this.actors[actor.__device.id + "." + actor.id]) {
				return true;
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
		Group.prototype.getActors = function() {
			var actors = [];

			for ( var id in this.actors) {
				actors.push(this.actors[id].__actor);
			}

			return actors;
		};
		
		/**
		 * 
		 */
		Group.prototype.getServices = function() {
			var services = [];

			for ( var id in this.services) {
				services.push(this.services[id].__service);
			}

			return services;
		};
	}
});