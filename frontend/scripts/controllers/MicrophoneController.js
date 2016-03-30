module.exports = function ($rootScope, $scope, $log, bowser, Navigator, FlashRecording, NativeRecording, UploadRecording) {
    $log.log('MicrophoneController initialized');

    this.sourceAudioElement = angular.element(document.querySelector('#sourceAudio'));
    this.outputAudioElement = angular.element(document.querySelector('#outputAudio'));

    var self = this;

    $scope.microphoneSourceAudioEnabled = !bowser.msie;

    var resetState = function() {
        $scope.microphoneSourceAudioReady = false;
        $scope.microphoneOutputAudioReady = false;
        $scope.microphoneStatus = 'status';
        $scope.microphoneTime = '0.0';
        $scope.microphoneLevel = 0;
        $scope.microphoneFlashVisible = false;
    };

    var getRecordingObject = function () {
        var recordingObject;

        if (Navigator.enabled) {
            recordingObject = NativeRecording;
            $scope.microphoneFlashEnabled = false;
        } else {
            recordingObject = FlashRecording;
            $scope.microphoneFlashEnabled = true;
        }
        return recordingObject;
    };

    (function init() {
        resetState();
        getRecordingObject().initialize();
    })();

    $rootScope.$on('statusEvent', function (event, data) {
        $scope.microphoneStatus = data;
    });

    $rootScope.$on('recordingEvent', function (event, data) {

        if(data) {
            if(data.time && !isNaN(data.time)) {
                $scope.microphoneTime = data.time.toFixed(2);
            }

            if(data.level) {
                if(isNaN(data.level) || data.level < 0) {
                    $scope.microphoneLevel = 0;
                } else {
                    $scope.microphoneLevel = Math.min(data.level, 100);
                }
            }

            refresh();
        }
    });

    $rootScope.$on('flashVisibilityChange', function (event, data) {
        self.setFlashVisible(data);
    });

    this.setFlashVisible = function(data) {
        $scope.microphoneFlashVisible = data;
        if($scope.microphoneFlashVisible) {
            FlashRecording.setFlashVisible(true);
        }
        refresh();
    };

    this.startRecording = function () {
        resetState();
        getRecordingObject().startRecording();
    };

    this.stopRecording = function () {
        $scope.microphoneLevel = 0;

        return getRecordingObject()
            .stopRecording()
            .then(function (encodedBlob){

                $log.log('MicrophoneController encodedBlob.size:' + encodedBlob.size);
                embedLocalBlob(encodedBlob);

                return UploadRecording
                    .send(encodedBlob, 'mp4', 'wav')
                    .then(displayProcessedOutput, function(reason) {$log.error(reason);});

            }, function(reason) { $log.error(reason);});

    };

    this.playSource = function () {
        document.getElementById('sourceAudio').play();
    };

    this.playOutput = function () {
        document.getElementById('outputAudio').play();
    };

    function embedLocalBlob(audioBlob) {
        self.sourceAudioElement.attr('src', URL.createObjectURL(audioBlob));
        $scope.microphoneSourceAudioReady = true;
    }

    function displayProcessedOutput(response) {
        if (response && response.data && response.data.inputUrl) {
            var audioSet = response.data;
            $log.log('received audioSet inputUrl:' + audioSet.inputUrl + ', outputUrl:' + audioSet.outputUrl);

            self.outputAudioElement.attr('src', audioSet.outputUrl);
            $scope.microphoneOutputAudioReady = true;

        } else {
            $log.error('response not in expected json form with inputUrl node');
            $log.error(response);
        }
    }

    function refresh() {
        if ($scope.$root.$$phase !== '$apply' && $scope.$root.$$phase !== '$digest') {
            $scope.$digest();
        }
    }

};