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
        '$log',
        '$q',
        '$rootScope',
        require('./factories/NavigatorFactory.js')
    ])
    .factory('NativeRecordingFactory', [
        '$log',
        '$q',
        'NavigatorFactory',
        require('./factories/NativeRecordingFactory.js')
    ])
    .factory('FlashRecordingFactory', [
        '$log',
        '$q',
        require('./factories/FlashRecordingFactory.js')
    ])
    .factory('UploadFactory', [
        '$log',
        '$http',
        require('./factories/UploadFactory.js')
    ]);