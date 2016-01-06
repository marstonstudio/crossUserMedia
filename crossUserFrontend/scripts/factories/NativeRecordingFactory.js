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

        var pcmBuffer = mergeBuffers(monochannel, recordingLength);
        var channelCount = 1;
        var bitsPerSample = 16;

        // we create our wav file
        var wavBuffer = new ArrayBuffer(44 + pcmBuffer.length * 2);
        var wavView = new DataView(wavBuffer);

        // RIFF chunk descriptor
        writeUTFBytes(wavView, 0, 'RIFF');
        wavView.setUint32(4, 44 + pcmBuffer.length * 2, true);
        writeUTFBytes(wavView, 8, 'WAVE');
        // FMT sub-chunk
        writeUTFBytes(wavView, 12, 'fmt ');
        wavView.setUint32(16, 16, true);
        wavView.setUint16(20, 1, true);
        wavView.setUint16(22, channelCount, true);
        wavView.setUint32(24, sampleRate, true);
        wavView.setUint32(28, sampleRate * channelCount * bitsPerSample / 8, true);
        wavView.setUint16(32, channelCount * bitsPerSample / 8, true);
        wavView.setUint16(34, bitsPerSample, true);
        // data sub-chunk
        writeUTFBytes(wavView, 36, 'data');
        wavView.setUint32(40, pcmBuffer.length * 2, true);

        // write the PCM samples
        var lng = pcmBuffer.length;
        var index = 44;
        var volume = 1;
        for (var j = 0; j < lng; j++) {
            wavView.setInt16(index, pcmBuffer[j] * (0x7FFF * volume), true);
            index += 2;
        }

        // our final binary blob
        var wavBlob = new Blob([ wavView ], { type: 'audio/wav' });

        /*
        var encodedResult = aacencoder({
            MEMFS: [{name: "input.wav", data: wavBuffer}],
            arguments: ["-i", "input.wav", "-b:a", "32k", "-strict", "-2", "output.mp4"],
            // Ignore stdin read requests.
            stdin: function() {},
        });
        // Write output.mp4 to disk.
        var output = encodedResult.MEMFS[0];
        fs.writeFileSync(output.name, Buffer(output.data));
        */

        $rootScope.$emit('statusEvent', 'audio saved');

        deferred.resolve(wavBlob);
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
};