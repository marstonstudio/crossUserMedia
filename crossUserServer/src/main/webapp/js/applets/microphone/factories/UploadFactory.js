angular.module('Microphone')
    .factory('UploadFactory', [
        '$log',
        '$http',
        'CONFIG',
        function($log, $http, CONFIG) {

            var Service = {};

            Service.send = function(audioBlob, inputFormat, outputFormat) {
                $log.log('Uploading to server');

                return $http.post('/rest/audio', {
                    payload: audioBlob,
                    inputFormat: inputFormat,
                    outputFormat: outputFormat
                });
            };

            return Service;
        }]
);