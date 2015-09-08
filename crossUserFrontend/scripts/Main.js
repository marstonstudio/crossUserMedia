var angular = require('angular');
require('angular-material');

angular.module('Microphone', ['ngMaterial'])

    .config(function($mdThemingProvider) {
        $mdThemingProvider.theme('default')
            .primaryPalette('teal')
            .accentPalette('indigo')
            .warnPalette('red')
            .backgroundPalette('grey');
    })

    .value('bowser', require('bowser'))

    .controller('MicrophoneController', [
        '$rootScope',
        '$scope',
        '$log',
        'bowser',
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
        '$window',
        '$q',
        require('./factories/FlashRecordingFactory.js')
    ])
    .factory('UploadFactory', [
        '$rootScope',
        '$log',
        '$http',
        require('./factories/UploadFactory.js')
    ]);