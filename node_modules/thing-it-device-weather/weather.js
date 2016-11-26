/**
 * The module exports are used by the [thing-it-node].
 * the first couple before state are mandatory for the device.
 *
 * State will be shown in many default screens and can very easily
 * be accessed in the HTML UI and other places.
 *
 * Services will be exposed in UIs as invocable by the user
 * and they will be exposed for orchestration.
 *
 * Configuration will be displayed when adding a device
 * on www.thing-it.com and in allows the device to access
 * the users' values during device creation on www.thing-it.com
 *
 */

module.exports = {
    metadata: {
        family: "weather",
        plugin: "weather",
        label: "Weather",
        tangible: true,
        discoverable: true,
        state: [{
            id: "temperature",
            label: "Temperature",
            type: {
                id: "decimal"
            }
        }, {
            id: "barometricPressure",
            label: "Barometric Pressure",
            type: {
                id: "decimal"
            }
        }, {
            id: "humidity",
            label: "Humidity",
            type: {
                id: "decimal"
            }
        }, {
            id: "weatherMain",
            label: "Weather Main",
            type: {
                id: "string"
            }
        }, {
            id: "weatherDescription",
            label: "Weather Description",
            type: {
                id: "string"
            }
        }, {
            id: "weatherIconUrl",
            label: "Weather Description",
            type: {
                id: "string"
            }
        }, {
            id: "cityId",
            label: "City Id",
            type: {
                id: "string"
            }
        }, {
            id: "cityName",
            label: "City Name",
            type: {
                id: "string"
            }
        }],
        actorTypes: [],
        sensorTypes: [],
        services: [{
            id: "update",
            label: "Update"
        }],
        configuration: [{
            id: "zip",
            label: "ZIP",
            type: {
                id: "string"
            }
        }, {
            id: "countryCode",
            label: "Country Code",
            type: {
                id: "string"
            }
        }, {
            id: "languageCode",
            label: "LanguageCode",
            type: {
                id: "string"
            }
        }, {
            id: "units",
            label: "Country Code",
            type: {
                id: "string"
            }
        }, {
            id: "updateFrequencySeconds",
            label: "Update Frequency Seconds",
            type: {
                id: "integer"
            }
        }, {
            id: "openWeatherMapKey",
            label: "Open Weather Map Key",
            type: {
                id: "string"
            }
        }]
    },

    /**
     * Invoked during start up to create the instance of
     * Weather for this specific device.
     *
     */
    create: function (device) {
        return new Weather();
    },

    /**
     * Discovery is an advanced function we don't need
     * for our Hello World example.
     *
     */
    discovery: function (options) {
        var discovery = new WeatherDiscovery();
        discovery.options = options;
        return discovery;
    }
};

var q = require('q');
var request;
var https;
//var WorldConnectionAPI;

/**
 * Discovery is an advanced function we don't need
 * for our Hello World example.
 *
 */
function WeatherDiscovery() {
    /**
     *
     */
    WeatherDiscovery.prototype.start = function () {
    };

    /**
     *
     */
    WeatherDiscovery.prototype.stop = function () {
    };
}

/**
 *
 */
function Weather() {

    var updateInterval;

    /**
     * - Makes initial call to weather service
     * - Sets up update every 10 minutes
     * - Simulation mode isn't neded for this device
     *
     */
    Weather.prototype.start = function () {
        var deferred = q.defer();

        // Initialize state values
        this.state = {
            temperature: null,
            barometricPressure: null,
            humidity: null,
            weatherMain: null,
            weatherDescription: null,
            weatherIconURL: null,
            cityId: null,
            cityName: null
        };

        if ((typeof this.configuration.openWeatherMapKey === undefined ) || !this.configuration.openWeatherMapKey || ("" == this.configuration.openWeatherMapKey)) {
            this.logError("An OpenWeatherMap Key is required for this device to work.");
            throw new Error("An OpenWeatherMap Key is required for this device to work.");
        }

        if ((typeof this.configuration.zip === undefined ) || !this.configuration.zip || ("" == this.configuration.zip)) {
            this.configuration.zip = "60594";
        }

        if ((typeof this.configuration.countryCode === undefined ) || !this.configuration.countryCode || ("" == this.configuration.countryCode)) {
            this.configuration.countryCode = "de";
        }

        if ((typeof this.configuration.units === undefined ) || !this.configuration.units || ("" == this.configuration.units)) {
            this.configuration.units = "metric";
        }

        if ((typeof this.configuration.language === undefined ) || !this.configuration.language || ("" == this.configuration.language)) {
            this.configuration.language = "de";
        }

        if ((typeof this.configuration.updateFrequencySeconds === undefined ) || !this.configuration.updateFrequencySeconds || (0 == this.configuration.updateFrequencySeconds)) {
            this.configuration.updateFrequencySeconds = 600;
        }

        this.logDebug("Configuration", this.configuration);

        if (this.isSimulated()) {
            // ignore, all we need is an internet connection.
        }

        this.logInfo("Starting up Weather.");

        this.getWeather();
        this.updateInterval = setInterval(function () {
            this.getWeather()
        }.bind(this), this.configuration.updateFrequencySeconds * 1000);
        deferred.resolve();
        return deferred.promise;
    };

    Weather.prototype.stop = function () {
        clearInterval(this.updateInterval);
    }

        /**
     * - Connects to OpenWeatherMap
     * - Sets the status
     */
    Weather.prototype.getWeather = function () {
        this.logInfo("Requesting weather update from http://api.openweathermap.org/");
        var deferred = q.defer();

        this.logDebug("Polling weather.", this.configuration);

        var url = "http://api.openweathermap.org/data/2.5/weather?zip=" + this.configuration.zip +
            "," + this.configuration.countryCode + "&units=" + this.configuration.units + "&lang=" +
            this.configuration.language + "&APPID=" + this.configuration.openWeatherMapKey;

        this.logDebug("Request URL", url);

        if (!request) {
            request = require('request');
        }

        request.get({
            url: url
        }, function (error, response, body) {
            if (error) {
                this.logError("Error communicating to weather service.", error, body);
            }
            else {
                var weatherData = JSON.parse(body);
                //this.logDebug(body);

                this.state = {
                    temperature: weatherData.main.temp,
                    barometricPressure: weatherData.main.pressure,
                    humidity: weatherData.main.humidity,
                    weatherMain: weatherData.weather[0].main,
                    weatherDescription: weatherData.weather[0].description,
                    weatherIconURL: "http://openweathermap.org/img/w/" + weatherData.weather[0].icon + ".png",
                    cityId: weatherData.id,
                    cityName: weatherData.name
                };

                this.publishStateChange();

            }
        }.bind(this));

        deferred.resolve();
        return deferred.promise;
    };


    /**
     *
     */
    Weather.prototype.update = function () {
        this.getWeather();
    }

    /**
     *
     */
    Weather.prototype.setState = function (state) {
        this.state = state;

        this.publishStateChange();
    };

    /**
     *
     */
    Weather.prototype.getState = function () {
        return this.state;
    };

}
