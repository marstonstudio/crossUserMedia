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
    .value('swfEmbedder', require('jakobmattsson-swfobject'))
    .value('ffmpegaac', require('ffmpegaac'))

    .controller('MicrophoneController', [
        '$rootScope',
        '$scope',
        '$log',
        'bowser',
        'NavigatorFactory',
        'FlashRecordingFactory',
        'NativeRecordingFactory',
        'EncoderFactory',
        'UploadFactory',
        require('./controllers/MicrophoneController.js')
    ])

    .directive('swfObject', [
        '$log',
        '$window',
        '$timeout',
        '$interval',
        'swfEmbedder',
        require('./directives/SwfObjectDirective.js')
    ])

    .factory('NavigatorFactory', [
        '$window',
        require('./factories/NavigatorFactory.js')
    ])
    .factory('NativeRecordingFactory', [
        '$rootScope',
        '$log',
        '$q',
        'NavigatorFactory',
        'EncoderFactory',
        require('./factories/NativeRecordingFactory.js')
    ])
    .factory('FlashRecordingFactory', [
        '$rootScope',
        '$log',
        '$window',
        '$q',
        'swfEmbedder',
        require('./factories/FlashRecordingFactory.js')
    ])
    .factory('EncoderFactory', [
        '$log',
        'ffmpegaac',
        require('./factories/EncoderFactory.js')
    ])
    .factory('UploadFactory', [
        '$rootScope',
        '$log',
        '$http',
        require('./factories/UploadFactory.js')
    ]);