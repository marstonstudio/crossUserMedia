var angular = require('angular');
var angularMaterial = require('angular-material');
var angularAria = require('angular-aria');
var angularAnimate = require('angular-animate');

var microphoneModule = angular.module('Microphone', ['ngMaterial'])

    .config(function($mdThemingProvider) {
        $mdThemingProvider.theme('default')
            .primaryPalette('teal')
            .accentPalette('indigo')
            .warnPalette('red')
            .backgroundPalette('grey');
    })

    .controller('MicrophoneController', [
        '$rootScope',
        '$scope',
        '$log',
        'NavigatorFactory',
        'FlashRecordingFactory',
        'NativeRecordingFactory',
        'UploadFactory',
        require('./controllers/MicrophoneController.js')
    ])

    .directive('swfObject', [
        '$log',
        '$window',
        '$timeout',
        '$interval',
        require('./directives/SwfObjectDirective.js')
    ])

    .factory('NavigatorFactory', [
        '$rootScope',
        '$log',
        '$q',
        require('./factories/NavigatorFactory.js')
    ])
    .factory('NativeRecordingFactory', [
        '$rootScope',
        '$log',
        '$q',
        'NavigatorFactory',
        require('./factories/NativeRecordingFactory.js')
    ])
    .factory('FlashRecordingFactory', [
        '$rootScope',
        '$log',
        '$q',
        require('./factories/FlashRecordingFactory.js')
    ])
    .factory('UploadFactory', [
        '$rootScope',
        '$log',
        '$http',
        require('./factories/UploadFactory.js')
    ]);