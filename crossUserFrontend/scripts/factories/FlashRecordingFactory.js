module.exports = function ($rootScope, $log, $q) {

    var Service = {};
    var recordingDeferred;

    var initialized = false;
    Service.initialize = function () {
        if (initialized) {
            return;
        }

        //functions globally accessible for flash ExternalInterface
        window.onFlashSoundRecorded = function (audioBase64) {
            $log.log("onFlashSoundRecorded length:" + audioBase64.length);

            var audioBlob = b64toBlob(audioBase64, 'audio/wav');
            recordingDeferred.resolve(audioBlob);
        };

        window.onFlashSoundRecordingError = function (error) {
            recordingDeferred.reject(error);
        };

        window.onFlashStatusMessage = function(message) {
            $rootScope.$emit('statusEvent', message);
        };

        window.onFlashRecording = function(time, level) {
            $rootScope.$emit('recordingEvent', {"time":time, "level":level});
        };

        window.onFlashDisplayChange = function(value) {
            $rootScope.$emit('flashDisplayChange', value);
        }

        initialized = true;
    };

    Service.showSettings = function () {
        document.getElementById('crossUserMicrophoneSwf').showSettings();
    }

    Service.startRecording = function () {
        document.getElementById('crossUserMicrophoneSwf').startRecording(false); // false == wav || true == ogg but can be converted to a string parameter
    };

    Service.stopRecording = function () {
        recordingDeferred = $q.defer();
        document.getElementById('crossUserMicrophoneSwf').stopRecording();

        return recordingDeferred.promise;
    };

    // http://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript
    function b64toBlob(b64Data, contentType, sliceSize) {
        contentType = contentType || '';
        sliceSize = sliceSize || 512;

        var byteCharacters = atob(b64Data);
        var byteArrays = [];

        for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            var slice = byteCharacters.slice(offset, offset + sliceSize);

            var byteNumbers = new Array(slice.length);
            for (var i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }

            var byteArray = new Uint8Array(byteNumbers);

            byteArrays.push(byteArray);
        }

        return new Blob(byteArrays, {type: contentType});
    }

    return Service;
}