angular.module('testApp', [])
    .controller('TestController', function () {
        this.bacnet = {
            _state: {
                presentValue: false,
                alarmValue: false,
                outOfService: false
            }
        };
    });