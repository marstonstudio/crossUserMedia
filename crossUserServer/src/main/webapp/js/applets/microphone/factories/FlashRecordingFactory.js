angular.module('Microphone')
    .factory('FlashRecordingFactory', [
        '$q',
        'CONFIG',
        function($q, CONFIG) {
            var Service = {};
            var recordingDeferred;

            Service.startRecording = function() {
                $('#crossUserMicrophoneSwf').startRecording(false); // false == wav || true == ogg but can be converted to a string parameter
            };

            Service.stopRecording = function() {
                recordingDeferred = $q.defer();
                $('#crossUserMicrophoneSwf').stopRecording();

                return recordingDeferred.promise;
            };

            Service.notifySoundRecorded = function() {
                console.log("onSoundRecorded length:" + audioBase64.length);

                var audioBlob = b64toBlob(audioBase64, 'audio/wav');
                recordingDeferred.resolve(audioBlob);
            };

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
    ]);

angular.element(document).ready(function() {
    var injector = angular.bootstrap(document, ['Microphone']);

    function onFlashSoundRecorded(audioBase64) {
        injector.invoke(['FlashRecordingFactory', function(FlashRecordingFactory) {
            FlashRecordingFactory.notifySoundRecorded(audioBase64);
        }]);
    }
});


