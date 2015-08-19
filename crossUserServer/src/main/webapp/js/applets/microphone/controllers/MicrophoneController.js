angular.module('Microphone')
    .controller('MicrophoneController', [
        '$log',
        'NavigatorFactory',
        'FlashRecordingFactory',
        'NativeRecordingFactory',
        'UploadFactory',
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

            this.flashMode = false;
            this.showSourceAudioButton = false;
            this.showOutputAudioButton = false;
            this.sourceAudioElement = angular.element(document.querySelector('#sourceAudio'));
            this.outputAudioElement = angular.element(document.querySelector('#outputAudio'));
            this.outputButtonElement = angular.element(document.querySelector('#outputButton'));
            this.downloadButtonElement = angular.element(document.querySelector('#downloadButton'));

            var getRecordingObject = function() {
                var recordingObject;

                if (Navigator.enabled) {
                    recordingObject = NativeRecording;
                    self.flashMode = false;
                } else {
                    recordingObject = FlashRecording;
                    self.flashMode = true;
                }

                recordingObject.initialize();

                return recordingObject;
            };

            var self = this;

            this.startRecording = function() {
                self.showSourceAudioButton = false;
                self.showOutputAudioButton = false;
                getRecordingObject().startRecording();
            };

            this.stopRecording = function() {
                return getRecordingObject()
                    .stopRecording()
                    .then(function(audioBlob) {
                        embedLocalBlob(audioBlob);
                        return UploadRecording
                            .send(audioBlob, self.inputFormat, self.outputFormat)
                            .then(displayProcessedOutput);
                    });
            };

            this.playSource = function() {
                document.getElementById('sourceAudio').play();
            };

            this.playOutput = function() {
                document.getElementById('outputAudio').play();
            };

            function embedLocalBlob(audioBlob) {
                $log.log("embedLocalBlob");

                angular.element(document.querySelector('#sourceButton')).html('play base64 source');
                self.sourceAudioElement.attr('src', URL.createObjectURL(audioBlob));
                self.showSourceAudioButton = true;
            }

            function displayProcessedOutput(response) {
                console.log(response);
                if (response) {
                    self.outputAudioElement.src = response;

                    self.outputButtonElement.html('play processed output');
                    self.showOutputAudioButton = true;

                    self.downloadButtonElement.html('download ' + self.outputFormat + ' file');
                    self.downloadButtonElement.show();
                }
            }


        }
    ]);