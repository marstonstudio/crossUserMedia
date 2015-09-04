module.exports = function ($rootScope, $scope, $log, Navigator, FlashRecording, NativeRecording, UploadRecording) {
    $log.log("MicrophoneController initialized");

    var FORMAT_WAV = 'wav';
    var FORMAT_OGG = 'ogg';
    var FORMAT_MP4 = 'mp4';

    var DEFAULT_INPUT_FORMAT = FORMAT_WAV;
    var DEFAULT_OUTPUT_FORMAT = FORMAT_MP4;

    this.supportedInputFormats = [FORMAT_WAV, FORMAT_OGG];
    this.supportedOutputFormats = [FORMAT_MP4];

    this.inputFormat = DEFAULT_INPUT_FORMAT;
    this.outputFormat = DEFAULT_OUTPUT_FORMAT;

    this.setInputFormat = function (format) {
        this.inputFormat = format;
    };

    this.setOutputFormat = function (format) {
        this.outputFormat = format;
    };

    this.sourceAudioElement = angular.element(document.querySelector('#sourceAudio'));
    this.outputAudioElement = angular.element(document.querySelector('#outputAudio'));
    this.downloadButtonElement = angular.element(document.querySelector('#downloadButton'));
    this.showFlash = false;

    var self = this;

    var resetState = function() {
        self.sourceAudioButtonEnabled = false;
        self.outputAudioButtonEnabled = false;
        self.downloadOutputButtonEnabled = false;
        self.downloadUrl = '';
        self.statusText = 'status';
        self.timerText = '0.0';
        self.microphoneLevel = 0;
    };

    var getRecordingObject = function () {
        var recordingObject;

        if (Navigator.enabled) {
            recordingObject = NativeRecording;
            self.useFlash = false;
        } else {
            recordingObject = FlashRecording;
            self.useFlash = true;
        }
        return recordingObject;
    };

    (function init() {
        resetState();
        getRecordingObject().initialize();
    })();

    $rootScope.$on('statusEvent', function (event, data) {
        self.statusText = data;
    });

    $rootScope.$on('recordingEvent', function (event, data) {

        if(data) {
            if(data.time && !isNaN(data.time))
                self.timerText = data.time.toFixed(2);

            if(data.level) {
                if(isNaN(data.level) || data.level < 0) {
                    self.volumeLevel = 0;
                } else {
                    self.volumeLevel = Math.min(data.level, 100);
                }
            }

            $scope.$digest();
        }
    });

    this.toggleShowFlash = function() {
        self.showFlash = !self.showFlash;
    }

    this.startRecording = function () {
        resetState();
        getRecordingObject().startRecording();
    };

    this.stopRecording = function () {
        self.volumeLevel = 0;

        return getRecordingObject()
            .stopRecording()
            .then(function (audioBlob) {
                embedLocalBlob(audioBlob);
                return UploadRecording
                    .send(audioBlob, self.inputFormat, self.outputFormat)
                    .then(displayProcessedOutput, function(response) {if(response && response.data) $log.error(response.data);});
            }, function(reason) {$log.error(reason);});
    };

    this.playSource = function () {
        document.getElementById('sourceAudio').play();
    };

    this.playOutput = function () {
        document.getElementById('outputAudio').play();
    };

    // http://pixelscommander.com/en/javascript/javascript-file-download-ignore-content-type/
    this.downloadOutput = function () {

        if (!self.downloadUrl) {
            return;
        }

        var outputUrl = self.downloadUrl;

        $log.log("Downloading " + outputUrl);
        //If in Chrome or Safari - download via virtual link click
        if (navigator.userAgent.toLowerCase().indexOf('chrome') > -1 ||
            navigator.userAgent.toLowerCase().indexOf('safari') > -1
        ) {
            //Creating new link node.
            var link = document.createElement('a');
            link.href = outputUrl;

            if (link.download !== undefined) {
                //Set HTML5 download attribute. This will prevent file from opening if supported.
                var fileName = outputUrl.substring(outputUrl.lastIndexOf('/') + 1, outputUrl.length);
                link.download = fileName;
            }

            //Dispatching click event.
            if (document.createEvent) {
                var e = document.createEvent('MouseEvents');
                e.initEvent('click', true, true);
                link.dispatchEvent(e);
                return true;
            }
        }

        // Force file download (whether supported by server).
        var query = '?download';

        window.open(outputUrl + query, "_blank");

    };

    function embedLocalBlob(audioBlob) {
        self.sourceAudioElement.attr('src', URL.createObjectURL(audioBlob));
        self.sourceAudioButtonEnabled = true;
    }

    function displayProcessedOutput(response) {
        if (response && response.data && response.data.inputUrl) {
            var audioSet = response.data;
            $log.log('received audioSet inputUrl:' + audioSet.inputUrl + ', outputUrl:' + audioSet.outputUrl);

            self.outputAudioElement.attr('src', audioSet.outputUrl);
            self.outputAudioButtonEnabled = true;

            self.downloadUrl = audioSet.outputUrl;
            self.downloadOutputButtonEnabled = true;

        } else {
            $log.error('response not in expected json form with inputUrl node');
            $log.error(response)
        }
    }

}