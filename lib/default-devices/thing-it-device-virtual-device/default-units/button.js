module.exports = {
	metadata : {
		plugin : "button",
		label : "Button",
		role : "sensor",
		family : "button",
		deviceTypes : [ "virtual-device/virtualDevice" ],
		configuration : []
	},
	create : function() {
		return new Button();
	}
};

/**
 * 
 */
function Button() {
	/**
	 * 
	 */
	Button.prototype.start = function() {
		try {
		} catch (x) {
			this.publishMessage("Cannot initialize " + this.device.id + "/"
					+ this.id + ":" + x);
		}
	};
};