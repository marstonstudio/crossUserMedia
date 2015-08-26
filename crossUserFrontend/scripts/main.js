var angular = require('angular');

angular.module('Microphone', [])
    .constant('CONFIG', CONFIG)
    .controller('MicrophoneController', [
        '$log',
        'NavigatorFactory',
        'FlashRecordingFactory',
        'NativeRecordingFactory',
        'UploadFactory',
        require('./controllers/MicrophoneController.js')
    ])
    .factory('NavigatorFactory', [
        '$log',
        '$q',
        '$rootScope',
        require('./factories/UploadFactory.js')
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
        '$q',
        '$rootScope',
        require('./factories/UploadFactory.js')
    ])