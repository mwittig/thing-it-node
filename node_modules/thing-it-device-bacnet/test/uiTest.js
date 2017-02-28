angular.module('testApp', [])
    .controller('TestController', function () {
        this.binary = {
            _state: {
                presentValue: false,
                alarmValue: true,
                outOfService: true
            }
        };

        this.analog = {
            _state: {
                presentValue: 77.77,
                alarmValue: true,
                outOfService: true
            },
            _configuration: {
                minValue: 0.0,
                maxValue: 100.0
            }
        };

    });