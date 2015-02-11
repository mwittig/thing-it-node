module.exports = {
	create : function() {
		return new Lcd();
	}
};

var q = require('q');

/**
 * 
 */
function Lcd() {
	/**
	 * 
	 */
	Lcd.prototype.start = function(app, io) {
		var deferred = q.defer();
		var self = this;

		this.startActor(app, io)
				.then(
						function() {
							self.column = 0;
							self.row = 0;

							// TODO Redesign: Other dimensions

							self.text = [
									[ ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ',
											' ', ' ', ' ', ' ', ' ', ' ', ' ',
											' ' ],
									[ ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ',
											' ', ' ', ' ', ' ', ' ', ' ', ' ',
											' ' ] ];

							if (!self.isSimulated()) {
								try {
									var five = require("johnny-five");

									lcd = new five.LCD({
										pins : [ self.configuration.rsPin,
												self.configuration.enPin,
												self.configuration.db4Pin,
												self.configuration.db5Pin,
												self.configuration.db6Pin,
												self.configuration.db7Pin ],
									// Options:
									// bitMode: 4 or 8, defaults to 4
									// lines: number of lines, defaults to 2
									// dots: matrix dimensions, defaults to
									// "5x8"
									// bitMode: this.configuration.bitMode,
									// lines: this.configuration.noOfLines,
									// dots: this.configuration.matrix
									});
								} catch (error) {
									deferred.resolve("Cannot initialize LCD: "
											+ error);
								}
							}

							deferred.resolve();
						}).fail(function(error) {
					deferred.reject(error);
				});

		return deferred.promise;
	};

	/**
	 * 
	 */
	Lcd.prototype.getState = function() {
		return {
			text : this.text,
			row : this.row,
			column : this.column
		};
	};

	/**
	 * 
	 */
	Lcd.prototype.clear = function() {
		this.text = [
				[ ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ',
						' ', ' ', ' ', ' ' ],
				[ ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ',
						' ', ' ', ' ', ' ' ] ];
		// this.lcd.clear();

		this.publishStateChange();
	};

	/**
	 * 
	 */
	Lcd.prototype.print = function(parameters) {
		for (var n = 0; n < parameters.text.length; ++n) {
			if (this.column == this.text[this.row].length) {
				++this.row;

				this.column = 0;

				if (this.row == this.text.length) {
					this.row = 0;

					break;
				}
			}

			this.text[this.row][this.column] = parameters.text.charAt(n);

			++this.column;
		}

		// this.lcd.print();

		this.publishStateChange();
	}

	/**
	 * 
	 */
	Lcd.prototype.cursorAt = function(parameters) {
		this.column = parameters.column;
		this.row = parameters.row;

		// this.lcd.cursorAt();

		this.publishStateChange();
	}

	/**
	 * 
	 */
	Lcd.prototype.publishStateChange = function() {
		this.device.node.publishActorStateChange(this.device, this, {
			text : this.text
		});
	}
};