module.exports = function($log, $q, $rootScope) {

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
            if (xmlhttp.readyState == 4) {
                if (xmlhttp.status == 200) {
                    deferred.resolve(xmlhttp.responseText);
                    $log.log('promise resolved: ' + xmlhttp.responseText);
                } else {
                    deferred.reject('Error during upload');
                    $log.log('promise rejected');
                }

                $rootScope.$apply();
            }
        };
        xmlhttp.send(formData);

        return deferred.promise;
    };

    return Service;
};