module.exports = function($rootScope, $log, $window, $q, Navigator, Encoder) {

    // http://typedarray.org/from-microphone-to-wav-to-server/
    // https://github.com/MicrosoftEdge/Demos/blob/master/webaudiotuner/scripts/demo.js

    var PCM_CODEC = 'pcm_f32le';
    var PCM_FORMAT = 'f32le';
    var ENCODED_CODEC = 'aac';
    var ENCODED_FORMAT = 'mp4';

    var CHANNELS = 1;
    var OUTPUT_BITRATE = 32000;
    var MAX_SECONDS = 30;

    var BUFFER_SIZE = 2048;

    var audioPassthru = null;
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
        $log.error('NativeRecordingFactory.js :: showSettings unimplemented');
    };

    Service.startRecording = function(passthru) {
        $log.log('NativeRecordingFactory.js :: startRecording passthru:' + passthru);
        $rootScope.$emit('statusEvent', 'recording started');
        
        audioPassthru = passthru;

        //try to avoid creating a new audioStream in firefox so we do not need to get permission again
        if( audioStream &&
            audioStream.getAudioTracks() && 
            audioStream.getAudioTracks().length > 0 && 
            audioStream.getAudioTracks()[0].readyState !== 'ended'
        ) {
            startUserMediaRecording(audioStream);
        } else {
            $log.log('NativeRecordingFactory.js :: creating new audioStream');
            Navigator.getNavigator().mediaDevices.getUserMedia(constraints)
                .then(startUserMediaRecording)
                .catch(logException);
        }
    };

    function startUserMediaRecording(stream) {
        var deferredStart = $q.defer();

        audioStream = stream;

        audioContext = new (window.AudioContext || window.webkitAudioContext)();

        audioInput = audioContext.createMediaStreamSource(audioStream);

        audioVolume = audioContext.createGain();
        audioInput.connect(audioVolume);

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

        Encoder.prepare()
            .then(function(){
                
                var outputFormat = audioPassthru ? PCM_FORMAT : ENCODED_FORMAT;
                var outputCodec = audioPassthru ? PCM_CODEC : ENCODED_CODEC;
                
                Encoder.init(PCM_FORMAT, PCM_CODEC, audioContext.sampleRate, CHANNELS, outputFormat, outputCodec, audioContext.sampleRate, CHANNELS, OUTPUT_BITRATE, MAX_SECONDS)
                    .then(function(){
                        audioVolume.connect(audioRecorder);
                        audioRecorder.connect(audioContext.destination);
                        deferredStart.resolve();

                    }).catch(logException);

            }).catch(logException);
        
        return deferredStart.promise;
    }

    Service.stopRecording = function() {
        $log.log('NativeRecordingFactory.js :: stopping recording');

        $rootScope.$emit('statusEvent', 'recording stopped');
        
        var deferredStop = $q.defer();

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
            audioRecorder.disconnect();
            audioRecorder = null;
        }

        if(audioAnalyser) {
            audioAnalyser.disconnect();
            audioAnalyser = null;
        }

        if(audioVolume) {
            audioVolume.disconnect();
            audioVolume = null;
        }

        if (audioInput) {
            audioInput.disconnect();
            audioInput = null;
        }
        
        if(audioContext) {
            audioContext.close();
            audioContext = null;
        }
        
        Encoder.load()
            .then(function(encodedSource){
                deferredStop.resolve(encodedSource);
            }).catch(logException);
        
        $rootScope.$emit('statusEvent', 'audio captured');
        return deferredStop.promise;
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