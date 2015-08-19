angular.module('Microphone')
    .factory('UploadFactory', [
        '$log',
        '$q',
        '$rootScope',
        'CONFIG',
        function($log, $q, $rootScope, CONFIG) {

            var Service = {};

            Service.send = function(audioBlob, inputFormat, outputFormat) {
                $log.log('Uploading to server');

                var deferred = $q.defer();

                var formData = new FormData();
                formData.append("payload", audioBlob);
                formData.append("inputFormat", inputFormat);
                formData.append("outputFormat", outputFormat);

                var xmlhttp = new XMLHttpRequest();
                xmlhttp.open("POST", "/rest/audio", true);
                xmlhttp.onreadystatechange = function() {
                    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                        deferred.resolve(xmlhttp.responseText);
                    } else {
                        deferred.reject('Error during upload');
                    };
                    console.log('promise resolved');
                    $rootScope.$apply();
                };
                xmlhttp.send(formData);

                return deferred.promise;
            };

            return Service;
        }]
);