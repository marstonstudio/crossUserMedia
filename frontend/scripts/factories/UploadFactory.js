module.exports = function($rootScope, $log, $http) {

    var Service = {};

    Service.send = function(audioBlob, inputFormat, inputSampleRate, outputFormat) {
        var formData = new FormData();
        formData.append('payload', audioBlob);
        formData.append('inputFormat', inputFormat);
        formData.append('inputSampleRate', inputSampleRate.toString());
        formData.append('outputFormat', outputFormat);

        //bogus way of setting Content-Type='multipart/form-data'
        //https://uncorkedstudios.com/blog/multipartformdata-file-upload-with-angularjs
        return $http.post(
            '/rest/audio',
            formData,
            { transformRequest: angular.identity, headers: {'Content-Type': undefined} }
        );
    };

    return Service;
};