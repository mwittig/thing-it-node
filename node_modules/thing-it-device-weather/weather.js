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
            id: "temperatureUnit",
            label: "Temperature Unit",
            type: {
                id: "string"
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
        }, {
            id: "clouds",
            label: "Cloud Percentage",
            type: {
                id: "integer"
            }
        }, {
            id: "rainLast3h",
            label: "Rain Last 3h",
            type: {
                id: "integer"
            }
        }, {
            id: "snowLast3h",
            label: "Snow Last 3h",
            type: {
                id: "integer"
            }
        }, {
            id: "windSpeed",
            label: "Wind Speed",
            type: {
                id: "integer"
            }
        }, {
            id: "windDirection",
            label: "Wind Direction",
            type: {
                id: "integer"
            }
        }, {
            id: "sunrise",
            label: "Sunrise",
            type: {
                id: "integer"
            }
        }, {
            id: "sunset",
            label: "Sunset",
            type: {
                id: "integer"
            }
        }],
        actorTypes: [],
        sensorTypes: [],
        services: [{
            id: "update",
            label: "Update"
        }],
        configuration: [{
            id: "cityName",
            label: "City Name",
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
            label: "Language Code",
            type: {
                id: "string"
            }
        }, {
            id: "units",
            label: "Units",
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
            cityName: null,
            clouds: 0,
            rainLast3h: 0,
            snowLast3h: 0,
            windSpeed: 0,
            windDirection: 0,
            sunrise: 0,
            sunset: 0
        };

        this.configError = false;

        if ((typeof this.configuration.openWeatherMapKey === undefined ) || !this.configuration.openWeatherMapKey || ("" == this.configuration.openWeatherMapKey)) {
            this.logError("An OpenWeatherMap Key is required for this device to work.");
            this.configError = true;
        }

        if ((typeof this.configuration.cityName === undefined ) || !this.configuration.cityName || ("" == this.configuration.cityName)) {
            this.configuration.cityName = "Frankfurt am Main";
        }

        if ((typeof this.configuration.countryCode === undefined ) || !this.configuration.countryCode || ("" == this.configuration.countryCode)) {
            this.configuration.countryCode = "de";
        }

        if ("metric" == this.configuration.units) {
            this.state.temperatureUnit = "&deg;C";
        } else if ("imperial" == this.configuration.units) {
            this.state.temperatureUnit = "&deg;F";
        } else {
            this.configuration.units = "metric";
            this.state.temperatureUnit = "&deg;C";
        }

        if ((typeof this.configuration.languageCode === undefined ) || !this.configuration.languageCode || ("" == this.configuration.languageCode)) {
            this.configuration.languageCode = "de";
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
        var deferred = q.defer();

        if (this.configError) {
            this.logError("Configuration error - cannot retrieve weather info.");
        } else {
            this.logInfo("Requesting weather update from http://api.openweathermap.org/");

            this.logDebug("Polling weather.", this.configuration);

            var url = "http://api.openweathermap.org/data/2.5/weather?q=" + this.configuration.cityName +
                "," + this.configuration.countryCode + "&units=" + this.configuration.units + "&lang=" +
                this.configuration.languageCode + "&APPID=" + this.configuration.openWeatherMapKey;

            this.logDebug("Request URL", url);

            if (!request) {
                request = require('request');
            }

            request.get({
                url: url
            }, function (error, response, body) {
                if (error) {
                    this.logError("Error communicating to weather service.", error, body);
                    deferred.reject("Error communicating to weather service.");
                }
                else {
                    var weatherData = JSON.parse(body);

                    if ((weatherData.cod) && (200 != weatherData.cod)) {
                        this.logError('Could not get weather. Error code ' + weatherData.cod + ' with message "'
                            + weatherData.message + '".');
                    } else {
                        try {
                            this.state = {
                                temperature: weatherData.main.temp,
                                barometricPressure: weatherData.main.pressure,
                                humidity: weatherData.main.humidity,
                                weatherMain: weatherData.weather[0].main,
                                weatherDescription: weatherData.weather[0].description,
                                weatherIconURL: "http://openweathermap.org/img/w/" + weatherData.weather[0].icon + ".png",
                                cityId: weatherData.id,
                                cityName: weatherData.name,
                                clouds: weatherData.clouds.all,
                                windSpeed: weatherData.wind.speed,
                                windDirection: weatherData.wind.deg,
                                sunrise: weatherData.sys.sunrise,
                                sunset: weatherData.sys.sunset
                            };

                            try {
                                this.state.rainLast3h = weatherData.rain['3h'];
                            } catch (e) {
                                //ignore
                            }

                            try {
                                this.state.snowLast3h = weatherData.snow['3h'];
                            } catch (e) {
                                //ignore
                            }

                            this.publishStateChange();
                        } catch (e) {
                            this.logError(e);
                        }

                        deferred.resolve();
                    }
                }
            }.bind(this));
        }

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
