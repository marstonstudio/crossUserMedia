module.exports = function($rootScope, $log, $q, Navigator, Encoder) {

    // http://typedarray.org/from-microphone-to-wav-to-server/

    var PCM_FORMAT = 'f32le';
    var OUTPUT_FORMAT = 'f32le';  //'f32le' for passthru, 'mp4' for encoding
    var BUFFER_SIZE = 2048;

    var volume = null;
    var audioStream = null;
    var context = null;
    var recorder = null;
    var audioInput = null;
    var analyser = null;

    var Service = {};

    Service.initialize = function() {};

    Service.showSettings = function () {
        $log.error('showSettings unimplemented for NativeRecordingFactory');
    };

    Service.startRecording = function() {
        $log.log('NativeRecordingFactory.js startRecording');
        $rootScope.$emit('statusEvent', 'recording started');

        if (Navigator.enabled) {
            Navigator.getNavigator().getUserMedia({audio: true, video: false}, startUserMediaRecording, function(e) {
                $log.error(e.message);
            });
        }
    };

    Service.stopRecording = function() {
        $rootScope.$emit('statusEvent', 'recording stopped');

        return stopUserMediaRecording();
    };

    function startUserMediaRecording(stream) {
        var deferred = $q.defer();

        audioStream = stream;

        // creates the audio context
        var audioContext = window.AudioContext || window.webkitAudioContext;
        context = new audioContext();

        // creates an audio node from the microphone incoming stream
        audioInput = context.createMediaStreamSource(audioStream);

        // creates a gain node
        volume = context.createGain();
        audioInput.connect(volume);

        // create an analyzer for volume graph
        //http://www.smartjava.org/content/exploring-html5-web-audio-visualizing-sound
        analyser = context.createAnalyser();
        analyser.smoothingTimeConstant = 0;
        analyser.fftSize = BUFFER_SIZE;
        audioInput.connect(analyser);
        
        recorder = context.createScriptProcessor(BUFFER_SIZE, 1, 1);

        recorder.onaudioprocess = function(e) {

            var array =  new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(array);
            var level = getAverageVolume(array);
            $rootScope.$emit('recordingEvent', {'time': e.playbackTime, 'level':level});

            var pcmArray = new Float32Array(e.inputBuffer.getChannelData(0));

            Encoder.load(pcmArray.buffer)
                .then(function(){
                    //$log.log('onaudioprocess time:' + e.playbackTime + ', level:' + level);

                }, function(reason) {
                    $log.error(reason);
                });
        };

        Encoder.init(PCM_FORMAT, context.sampleRate, OUTPUT_FORMAT)
            .then(function(){
                volume.connect(recorder);
                recorder.connect(context.destination);
                deferred.resolve();
                
            }, function(reason) {
                $log.error(reason);
            });

        return deferred.promise;
    }

    // https://blogs.windows.com/msedgedev/2015/05/13/announcing-media-capture-functionality-in-microsoft-edge/
    // https://github.com/MicrosoftEdge/Demos/blob/master/webaudiotuner/scripts/demo.js
    function stopUserMediaRecording() {
        var deferred = $q.defer();

        $rootScope.$emit('statusEvent', 'audio saving');

        if (audioInput) {
            audioInput.disconnect();
        }
        if (audioStream && audioStream.active) {
            var audioTracks = audioStream.getAudioTracks();
            if(audioTracks) {
                for (var i = 0; i < audioTracks.length; i++) {
                    audioTracks[i].stop();
                }
            }
        }
        if (recorder) {
            recorder.onaudioprocess = null;
        }

        Encoder.flush()
            .then(function(encodedSource){
                Encoder.dispose();
                deferred.resolve(encodedSource);

            }, function(reason) {$log.error(reason);});
        
        $rootScope.$emit('statusEvent', 'audio captured');
        return deferred.promise;
    }

    function getAverageVolume(array) {
        var values = 0;
        var average;

        var length = array.length;

        // get all the frequency amplitudes
        for (var i = 0; i < length; i++) {
            values += array[i];
        }

        average = values / length;
        return average;
    }

    return Service;
};