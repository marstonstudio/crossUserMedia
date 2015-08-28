 module.exports = function ($log, Navigator, FlashRecording, NativeRecording, UploadRecording) {
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

    this.flashMode = false;
    this.showSourceAudioButton = false;
    this.showOutputAudioButton = false;
    this.showDownloadOutputButton = false;
    this.showError = false;
    this.sourceAudioElement = angular.element(document.querySelector('#sourceAudio'));
    this.outputAudioElement = angular.element(document.querySelector('#outputAudio'));
    this.outputButtonElement = angular.element(document.querySelector('#outputButton'));
    this.downloadButtonElement = angular.element(document.querySelector('#downloadButton'));
    this.errorElement = angular.element(document.querySelector('#error'));
    this.downloadUrl = '';

    var self = this;

    var getRecordingObject = function () {
        var recordingObject;

        if (Navigator.enabled) {
            recordingObject = NativeRecording;
            self.flashMode = false;
        } else {
            recordingObject = FlashRecording;
            self.flashMode = true;
        }
        return recordingObject;
    };

    (function init() {
        getRecordingObject().initialize();
    })();

    var resetState = function() {
        self.showSourceAudioButton = false;
        self.showOutputAudioButton = false;
        self.showDownloadOutputButton = false;
        self.showError = false;
        self.downloadUrl = '';
    };

    this.startRecording = function () {
        resetState();
        getRecordingObject().startRecording();
    };

    this.stopRecording = function () {
        return getRecordingObject()
            .stopRecording()
            .then(function (audioBlob) {
                embedLocalBlob(audioBlob);
                return UploadRecording
                    .send(audioBlob, self.inputFormat, self.outputFormat)
                    .then(displayProcessedOutput, function(reason){$log.error(reason);});
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
        angular.element(document.querySelector('#sourceButton')).html('play base64 source');
        self.sourceAudioElement.attr('src', URL.createObjectURL(audioBlob));
        self.showSourceAudioButton = true;
    }

    function displayProcessedOutput(audioSet) {
        if (audioSet && audioSet.outputUrl) {
            $log.log('received audioSet inputUrl:' + audioSet.inputUrl + ', outputUrl:' + audioSet.outputUrl);

            self.downloadUrl = audioSet.outputUrl;
            self.outputAudioElement.attr('src', audioSet.outputUrl);

            self.outputButtonElement.html('play processed output');
            self.showOutputAudioButton = true;

            self.downloadButtonElement.html('download ' + self.outputFormat + ' file');
            self.showDownloadOutputButton = true;
        }
    }

}