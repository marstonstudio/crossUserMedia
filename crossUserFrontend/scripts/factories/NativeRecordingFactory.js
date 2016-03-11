module.exports = function($rootScope, $log, $q, Navigator) {

    // http://typedarray.org/from-microphone-to-wav-to-server/

    var monochannel = [];
    var recordingLength = 0;
    var volume = null;
    var sampleRate = null;
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
        $log.log('NativeRecordingFactory startRecording');
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
        monochannel.length = 0;
        recordingLength = 0;

        audioStream = stream;

        // creates the audio context
        var audioContext = window.AudioContext || window.webkitAudioContext;
        context = new audioContext();

        // retrieve the current sample rate to be used for WAV packaging
        sampleRate = context.sampleRate;

        // creates an audio node from the microphone incoming stream
        audioInput = context.createMediaStreamSource(audioStream);

        // creates a gain node
        volume = context.createGain();
        audioInput.connect(volume);

        // create an analyzer for volume graph
        //http://www.smartjava.org/content/exploring-html5-web-audio-visualizing-sound
        analyser = context.createAnalyser();
        analyser.smoothingTimeConstant = 0;
        analyser.fftSize = 2048;
        audioInput.connect(analyser);

        /* From the spec: This value controls how frequently the audioprocess event is
         dispatched and how many sample-frames need to be processed each call.
         Lower values for buffer size will result in a lower (better) latency.
         Higher values will be necessary to avoid audio breakup and glitches */
        var bufferSize = 2048;
        recorder = context.createScriptProcessor(bufferSize, 1, 1);

        recorder.onaudioprocess = function(e) {

            var array =  new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(array);
            var level = getAverageVolume(array);
            //$log.log('onaudioprocess time:' + e.playbackTime + ", level:" + level);
            $rootScope.$emit('recordingEvent', {'time': e.playbackTime, 'level':level});

            //TODO: use AudioBuffer.copyFromChannel()
            //https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer/copyFromChannel

            var mono = e.inputBuffer.getChannelData(0);
            // we clone the samples
            monochannel.push(new Float32Array(mono));
            recordingLength += bufferSize;
        };

        // we connect the recorder
        volume.connect(recorder);
        recorder.connect(context.destination);
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

        //flatten all the 2048 length chunks of pcm data into a single Float32Array
        var pcmArray = new Float32Array(recordingLength);
        var offset = 0;
        var chunkCount = monochannel.length;
        for (var c = 0; c < chunkCount; c++) {
            var chunk = monochannel[c];
            pcmArray.set(chunk, offset);
            offset += chunk.length;
        }

        deferred.resolve({'sampleRate':sampleRate, 'pcmBuffer':pcmArray.buffer});
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