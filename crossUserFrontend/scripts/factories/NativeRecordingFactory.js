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
    }

    Service.startRecording = function() {
        $rootScope.$emit('statusEvent', 'recording started');

        if (Navigator.enabled) {
            Navigator.getNavigator().getUserMedia({audio: true}, startUserMediaRecording, function(e) {
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
            $rootScope.$emit('recordingEvent', {"time": e.playbackTime, "level":level});

            var mono = e.inputBuffer.getChannelData(0);
            // we clone the samples
            monochannel.push(new Float32Array(mono));
            recordingLength += bufferSize;
        };

        // we connect the recorder
        volume.connect(recorder);
        recorder.connect(context.destination);
    }

    function stopUserMediaRecording() {
        var deferred = $q.defer();

        $rootScope.$emit('statusEvent', 'audio saving');

        if (audioInput) {
            audioInput.disconnect();
        }
        if (audioStream && audioStream.active) {
            var audioTracks = audioStream.getAudioTracks();
            for(var key in audioTracks) {
                audioTracks[key].stop();
            }
        }
        if (recorder) {
            recorder.onaudioprocess = null;
        }

        var outputBuffer = mergeBuffers(monochannel, recordingLength);
        var channelCount = 1;
        var bitsPerSample = 16;

        // we create our wav file
        var buffer = new ArrayBuffer(44 + outputBuffer.length * 2);
        var view = new DataView(buffer);

        // RIFF chunk descriptor
        writeUTFBytes(view, 0, 'RIFF');
        view.setUint32(4, 44 + outputBuffer.length * 2, true);
        writeUTFBytes(view, 8, 'WAVE');
        // FMT sub-chunk
        writeUTFBytes(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, channelCount, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * channelCount * bitsPerSample / 8, true);
        view.setUint16(32, channelCount * bitsPerSample / 8, true);
        view.setUint16(34, bitsPerSample, true);
        // data sub-chunk
        writeUTFBytes(view, 36, 'data');
        view.setUint32(40, outputBuffer.length * 2, true);

        // write the PCM samples
        var lng = outputBuffer.length;
        var index = 44;
        var volume = 1;
        for (var i = 0; i < lng; i++) {
            view.setInt16(index, outputBuffer[i] * (0x7FFF * volume), true);
            index += 2;
        }

        // our final binary blob
        var audioBlob = new Blob([ view ], { type: 'audio/wav' });

        $rootScope.$emit('statusEvent', 'audio saved');

        deferred.resolve(audioBlob);
        return deferred.promise;
    }

    function mergeBuffers(channelBuffer, recordingLength) {
        var result = new Float32Array(recordingLength);
        var offset = 0;
        var lng = channelBuffer.length;
        for (var i = 0; i < lng; i++) {
            var buffer = channelBuffer[i];
            result.set(buffer, offset);
            offset += buffer.length;
        }
        return result;
    }

    function writeUTFBytes(view, offset, string) {
        var lng = string.length;
        for (var i = 0; i < lng; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
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
}