module.exports = {
	metadata : {
		plugin : "knob",
		label : "Knob",
		role : "sensor",
		family : "knob",
		deviceTypes : [ "virtual-device/virtualDevice" ],
		configuration : [ {
			label : "Rate",
			id : "rate",
			type : {
				id : "integer"
			},
			defaultValue : 1000,
			unit : "ms"
		}, {
			label : "Minimum",
			id : "min",
			type : {
				id : "integer"
			},
			defaultValue : 0
		}, {
			label : "Maximum",
			id : "max",
			type : {
				id : "integer"
			},
			defaultValue : 1023
		} ]
	},
	create : function() {
		return new Knob();
	}
};

/**
 * 
 */
function Knob() {
	/**
	 * 
	 */
	Knob.prototype.start = function(app, io) {
		this.startSensor(app, io);

		try {
		} catch (x) {
			this.publishMessage("Cannot initialize " + this.device.id + "/"
					+ this.id + ":" + x);
		}
	};
};