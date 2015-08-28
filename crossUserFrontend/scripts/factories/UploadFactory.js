module.exports = function($log, $q, $http) {

    var Service = {};

    Service.send = function(audioBlob, inputFormat, outputFormat) {

        var deferred = $q.defer();

        var formData = new FormData();
        formData.append("payload", audioBlob);
        formData.append("inputFormat", inputFormat);
        formData.append("outputFormat", outputFormat);

        $http.post(
            '/rest/audio',
            formData, {
                transformRequest: angular.identity,
                headers: {'Content-Type': undefined}
            }
        ).then(function(response) {
            deferred.resolve(response.data);
        }, function(response) {
            deferred.reject(response.data);
        });

        return deferred.promise;
    };

    return Service;
};