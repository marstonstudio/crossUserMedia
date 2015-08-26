module.exports = function($log, $q, Navigator) {

    var leftchannel = [];
    var rightchannel = [];
    var recordingLength = 0;
    var volume = null;
    var sampleRate = null;
    var audioStream = null;
    var context = null;
    var recorder = null;
    var audioInput = null;

    var Service = {};

    Service.initialize = function() {};

    Service.startRecording = function() {
        $log.log("Start Recording");

        if (Navigator.enabled) {
            Navigator.getNavigator().getUserMedia({audio: true}, startUserMediaRecording, function(e) {
                $log.error(e.message);
            });
        }
    };

    Service.stopRecording = function() {
        $log.log("Stop Recording");

        return stopUserMediaRecording();
    };

    function startUserMediaRecording(stream) {

        leftchannel.length = rightchannel.length = 0;
        recordingLength = 0;

        audioStream = stream;

        // creates the audio context
        var audioContext = window.AudioContext || window.webkitAudioContext;
        context = new audioContext();

        // retrieve the current sample rate to be used for WAV packaging
        sampleRate = context.sampleRate;

        // creates a gain node
        volume = context.createGain();

        // creates an audio node from the microphone incoming stream
        audioInput = context.createMediaStreamSource(audioStream);

        // connect the stream to the gain node
        audioInput.connect(volume);

        /* From the spec: This value controls how frequently the audioprocess event is
         dispatched and how many sample-frames need to be processed each call.
         Lower values for buffer size will result in a lower (better) latency.
         Higher values will be necessary to avoid audio breakup and glitches */
        var bufferSize = 2048;
        recorder = context.createScriptProcessor(bufferSize, 2, 2);

        recorder.onaudioprocess = function(e) {
            $log.log('recording');
            var left = e.inputBuffer.getChannelData(0);
            var right = e.inputBuffer.getChannelData(1);
            // we clone the samples
            leftchannel.push(new Float32Array(left));
            rightchannel.push(new Float32Array(right));
            recordingLength += bufferSize;
        };

        // we connect the recorder
        volume.connect(recorder);
        recorder.connect(context.destination);
    }

    function stopUserMediaRecording() {
        var deferred = $q.defer();

        if (audioInput) {
            audioInput.disconnect();
        }
        if (audioStream) {
            audioStream.stop();
        }
        if (recorder) {
            recorder.onaudioprocess = null;
        }

        // we flat the left and right channels down
        //var leftBuffer = mergeBuffers ( leftchannel, recordingLength );
        //var rightBuffer = mergeBuffers ( rightchannel, recordingLength );
        // we interleave both channels together
        //var outputBuffer = interleave ( leftBuffer, rightBuffer );

        var outputBuffer = mergeBuffers(leftchannel, recordingLength);
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

    function interleave(leftChannel, rightChannel) {
        var length = leftChannel.length + rightChannel.length;
        var result = new Float32Array(length);

        var inputIndex = 0;

        for (var index = 0; index < length;) {
            result[index++] = leftChannel[inputIndex];
            result[index++] = rightChannel[inputIndex];
            inputIndex++;
        }
        return result;
    }

    function writeUTFBytes(view, offset, string) {
        var lng = string.length;
        for (var i = 0; i < lng; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    return Service;
}