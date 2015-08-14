angular.module('Microphone')
    .controller('MicrophoneController', [
        '$log',
        'NavigatorFactory',
        'FlashRecordingFactory',
        'NativeRecordingFactory',
        'UploadRecordingFactory',
        function($log, Navigator, FlashRecording, NativeRecording, UploadRecording) {


            var FORMAT_WAV = 'wav';
            var FORMAT_OGG = 'ogg';
            var FORMAT_MP4 = 'mp4';

            var DEFAULT_INPUT_FORMAT = FORMAT_WAV;
            var DEFAULT_OUTPUT_FORMAT = FORMAT_MP4;

            this.supportedInputFormats = [FORMAT_WAV, FORMAT_OGG];
            this.supportedOutputFormats = [FORMAT_MP4];

            this.inputFormat = DEFAULT_INPUT_FORMAT;
            this.outputFormat = DEFAULT_OUTPUT_FORMAT;

            this.setInputFormat = function(format) {
                this.inputFormat = format;
            };

            this.setOutputFormat = function(format) {
                this.outputFormat = format;
            };

            this.showSourceAudioButton = false;
            this.showOutputAudioButton = false;
            this.sourceAudioElement = angular.element('#sourceAudio');
            this.outputAudioElement = angular.element('#outputAudio');
            this.outputButtonElement = angular.element('#outputButton');
            this.downloadButtonElement = angular.element('#downloadButton');

            var recordingObject = Navigator.enabled ? NativeRecording : FlashRecording;

            var self = this;

            this.startRecording = function() {
                self.showSourceAudioButton = false;
                self.showOutputAudioButton = false;
                recordingObject.startRecording();
            };

            this.stopRecording = function() {
                return recordingObject
                    .stopRecording()
                    .then(function(audioBlob) {
                        embedLocalBlob(audioBlob);
                        return UploadRecording
                            .send(audioBlob, self.inputFormat, self.outputFormat)
                            .then(displayProcessedOutput);
                    });
            };

            function embedLocalBlob(audioBlob) {
                $log.log("embedLocalBlob");

                angular.element('#sourceButton').html('play base64 source');
                self.sourceAudioElement.attr('src', URL.createObjectURL(audioBlob));
                self.showSourceAudioButton = true;
            }

            function displayProcessedOutput(response) {
                if (response.data) {
                    self.outputAudioElement.src = response.data;

                    self.outputButtonElement.html('play processed output');
                    self.showOutputAudioButton = true;

                    self.downloadButtonElement.html('download ' + self.outputFormat + ' file');
                    self.downloadButtonElement.show();
                }
            }


        }
    ]);