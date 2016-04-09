module.exports = function ($rootScope, $log, $window, $q, swfEmbedder, Base64) {

    var deferred;

    var initialized = false;
    var hasFlashInstalled = false;
    
    var Service = {};

    Service.initialize = function () {
        if (initialized) {
            return;
        }

        //functions globally accessible for flash ExternalInterface
        $window.onFlashSoundRecorded = function (outputAudioB64, outputFormat, outputSampleRate) {
            var outputAudio = b64toByteArray(outputAudioB64);
            var blob = new Blob([outputAudio.buffer], { type: 'audio/' + outputFormat });

            deferred.resolve({
                'format':outputFormat,
                'sampleRate':outputSampleRate,
                'blob':blob
            });
        };

        $window.onFlashSoundRecordingError = function (error) {
            deferred.reject(error);
        };

        $window.onFlashStatusMessage = function(message) {
            $rootScope.$emit('statusEvent', message);
        };

        $window.onFlashRecording = function(time, level) {
            $rootScope.$emit('recordingEvent', {'time':time, 'level':level});
        };

        $window.onFlashVisibilityChange = function(value) {
            $rootScope.$emit('flashVisibilityChange', value);
        };

        hasFlashInstalled = swfEmbedder.getFlashPlayerVersion().major > 0;
        initialized = true;
    };

    Service.setFlashVisible = function (data) {
        if(hasFlashInstalled) {
            getFlashObject().setFlashVisible(data);
        }
    };

    Service.startRecording = function () {
        $log.log('FlashRecordingFactory.js startRecording');
        if(hasFlashInstalled) {
            getFlashObject().startRecording();
        }
    };

    Service.stopRecording = function () {
        deferred = $q.defer();
        if(hasFlashInstalled) {
            getFlashObject().stopRecording();
        }
        return deferred.promise;
    };

    function getFlashObject() {
        return document.getElementById('microphoneSwf');
    }

    // http://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript
    function b64toByteArray(base64Data) {
        var byteCharacters = Base64.urlSafeDecode(base64Data);
        var byteNumbers = new Array(byteCharacters.length);
        for (var i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        return new Uint8Array(byteNumbers);
    }

    return Service;
};