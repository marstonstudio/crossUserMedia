angular.module('Microphone')
    .factory('NavigatorFactory', ['$window', function($window) {
        var Service = {};
        var navigator = $window.navigator;

        if (!navigator.getUserMedia) {
            navigator.getUserMedia =
                navigator.getUserMedia ||
                navigator.webkitGetUserMedia ||
                navigator.mozGetUserMedia ||
                navigator.msGetUserMedia;
        }

        Service.enabled = typeof navigator.getUserMedia === 'function';

        Service.getUserMedia = navigator.getUserMedia;

        return Service;
    }]);