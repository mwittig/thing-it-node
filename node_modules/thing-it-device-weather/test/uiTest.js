angular.module('testApp', [])
    .controller('TestController', function () {
        this.weather = {
            _state: {
                temperatureUnit: 'C',
                temperature: 24,
                barometricPressure: 1010,
                humidity: 73,
                weatherMain: 'Rain',
                weatherDescription: 'light rain',
                weatherIconURL: 'http://openweathermap.org/img/w/10d.png',
                cityId: 2147714,
                cityName: 'Sydney',
                clouds: 75,
                windSpeed: 8.2,
                windSpeedUnit: 'mps',
                windDirection: 210,
                sunrise: 1481654300,
                sunset: 1481706108
            }

        };
        // this.channel = {_state: {cumulatedReading: 27}};
    });