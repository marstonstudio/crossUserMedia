module.exports = function($rootScope, $log, $q, Navigator, Encoder) {

    // http://typedarray.org/from-microphone-to-wav-to-server/

    var PCM_FORMAT = 'f32le';
    var OUTPUT_FORMAT = 'f32le';  //'f32le' for passthru, 'mp4' for encoding
    var BUFFER_SIZE = 2048;

    var audioStream = null;
    var audioContext = null;
    var audioInput = null;
    var audioVolume = null;
    var audioAnalyser = null;
    var audioRecorder = null;
    
    var constraints = {audio: true, video: false};

    var Service = {};

    Service.initialize = function() {};

    Service.showSettings = function () {
        $log.error('showSettings unimplemented for NativeRecordingFactory');
    };

    Service.startRecording = function() {
        $log.log('NativeRecordingFactory.js ! startRecording');
        $rootScope.$emit('statusEvent', 'recording started');

        if (Navigator.enabled) {
            Navigator.getNavigator().getUserMedia(constraints, startUserMediaRecording, logException);
        }
    };

    function startUserMediaRecording(stream) {
        var deferred = $q.defer();

        audioStream = stream;

        // creates the audio audioContext
        audioContext = new window.AudioContext();

        // creates an audio node from the microphone incoming stream
        audioInput = audioContext.createMediaStreamSource(audioStream);

        // creates a gain node
        audioVolume = audioContext.createGain();
        audioInput.connect(audioVolume);

        // create an analyzer for audioVolume graph
        //http://www.smartjava.org/content/exploring-html5-web-audio-visualizing-sound
        audioAnalyser = audioContext.createAnalyser();
        audioAnalyser.smoothingTimeConstant = 0;
        audioAnalyser.fftSize = BUFFER_SIZE;
        audioInput.connect(audioAnalyser);
        
        audioRecorder = audioContext.createScriptProcessor(BUFFER_SIZE, 1, 1);

        audioRecorder.onaudioprocess = function(e) {

            var array =  new Uint8Array(audioAnalyser.frequencyBinCount);
            audioAnalyser.getByteFrequencyData(array);
            var level = getAverageVolume(array);
            $rootScope.$emit('recordingEvent', {'time': e.playbackTime, 'level':level});

            var pcmArray = new Float32Array(e.inputBuffer.getChannelData(0));

            Encoder.load(pcmArray.buffer)
                .then(function(){
                    //$log.log('onaudioprocess time:' + e.playbackTime + ', level:' + level);

                }).catch(logException);
        };

        Encoder.init(PCM_FORMAT, audioContext.sampleRate, OUTPUT_FORMAT)
            .then(function(){
                audioVolume.connect(audioRecorder);
                audioRecorder.connect(audioContext.destination);
                deferred.resolve();
                
            }).catch(logException);

        return deferred.promise;
    }

    // https://blogs.windows.com/msedgedev/2015/05/13/announcing-media-capture-functionality-in-microsoft-edge/
    // https://github.com/MicrosoftEdge/Demos/blob/master/webaudiotuner/scripts/demo.js
    Service.stopRecording = function() {
        $rootScope.$emit('statusEvent', 'recording stopped');
        
        var deferred = $q.defer();

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
        if (audioRecorder) {
            audioRecorder.onaudioprocess = null;
        }

        Encoder.flush()
            .then(function(encodedSource){
                Encoder.dispose();
                deferred.resolve(encodedSource);

            }).catch(logException);
        
        $rootScope.$emit('statusEvent', 'audio captured');
        return deferred.promise;
    };

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
    
    function logException(ex) {
        $log.error(ex);
    }

    return Service;
};