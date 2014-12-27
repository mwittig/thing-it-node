module.exports = {
	create : function() {
		return new BloodOxygen();
	}
};

/**
 * 
 */
function BloodOxygen() {
	/**
	 * 
	 */
	BloodOxygen.prototype.start = function(app, io) {
		this.startSensor(app, io);
		this.startPolling(function() {
			return (new Date().getTime() % 2345);
		}, 10000);
	};

	/**
	 * 
	 */
	BloodOxygen.prototype.stop = function() {
		this.stopPolling();
		this.stopSensor();
	};
};