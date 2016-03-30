module.exports = function ($rootScope, $log, $window, $q, swfEmbedder) {

    var Service = {};
    var recordingDeferred;

    var initialized = false;
    var hasFlashInstalled = false;

    Service.initialize = function () {
        if (initialized) {
            return;
        }

        //functions globally accessible for flash ExternalInterface
        $window.onFlashSoundRecorded = function (sampleRate, audioBase64) {
            var pcmArray = b64toByteArray(audioBase64);
            var pcmBlob = new Blob([pcmArray.buffer], { type: 'audio/L16' });
            recordingDeferred.resolve(pcmBlob);
        };

        $window.onFlashSoundRecordingError = function (error) {
            recordingDeferred.reject(error);
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
        $log.log('FlashRecordingFactory startRecording');
        if(hasFlashInstalled) {
            getFlashObject().startRecording();
        }
    };

    Service.stopRecording = function () {
        recordingDeferred = $q.defer();
        if(hasFlashInstalled) {
            getFlashObject().stopRecording();
        }
        return recordingDeferred.promise;
    };

    function getFlashObject() {
        return document.getElementById('microphoneSwf');
    }

    // http://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript
    function b64toByteArray(base64Data) {

        var byteCharacters = atob(base64Data);
        var byteNumbers = new Array(byteCharacters.length);
        for (var i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        return new Uint8Array(byteNumbers);
    }

    return Service;
};