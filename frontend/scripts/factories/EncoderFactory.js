module.exports = function ($log, $q, pcmencoder) {

    var Service = {};

    var encoder;
    var deferred;
    
    var workerOnMessage = function(e) {
        $log.log('EncoderFactory.js :: workerOnMessage cmd:' + e.data.cmd);

        switch(e.data.cmd) {
            
            case 'prepareComplete':
                deferred.resolve();
                break;

            case 'initComplete':
                deferred.resolve();
                break;

            case 'loadComplete':
                deferred.resolve();
                break;

            case 'flushComplete':
                if(e.data.outputAudio) {
                    var blob = new Blob([e.data.outputAudio], { type: 'audio/' + e.data.outputFormat });
                    deferred.resolve({
                        'format':e.data.outputFormat,
                        'sampleRate':e.data.outputSampleRate,
                        'blob':blob
                    });
                } else {
                    deferred.reject('EncoderFactory.js :: no data received');
                }
                break;
            
            default:
                $log.error('EncoderFactory.js :: unknown command ' + e.data.cmd);
        }
    };

    var workerOnError = function(e) {
        if(e.filename && e.lineno && e.message) {
            $log.error('EncoderFactory.js :: listener error ' + e.filename + ' line:' + e.lineno + ' ' + e.message);
        } else {
            $log.error('EncoderFactory.js :: listener error ' + e);
        }
    };

    //TODO: figure out a better way to make this reference through browserify to get the javascript properly loaded as a webworker
    // https://github.com/substack/webworkify
    // https://github.com/shama/workerify
    // https://github.com/fabiosantoscode/require-emscripten
    Service.prepare = function () {
        //$log.log('EncoderFactory.js :: prepare');

        encoder = new Worker('/js/encoder.js');
        encoder.onmessage = workerOnMessage;
        encoder.onerror = workerOnError;

        deferred = $q.defer();
        return deferred.promise;
    };

    Service.init = function (inputFormat, inputCodec, inputSampleRate, inputChannels, outputFormat, outputCodec, outputSampleRate, outputChannels, outputBitRate, maxSeconds) {
        //$log.log('EncoderFactory.js :: init');

        deferred = $q.defer();
        encoder.postMessage({
            'cmd':'init', 
            'inputFormat': inputFormat,
            'inputCodec': inputCodec,
            'inputSampleRate': inputSampleRate,
            'inputChannels': inputChannels,
            'outputFormat': outputFormat,
            'outputCodec': outputCodec,
            'outputSampleRate': outputSampleRate,
            'outputChannels': outputChannels,
            'outputBitRate': outputBitRate,
            'maxSeconds': maxSeconds
        });
        return deferred.promise;
    };

    Service.load = function(inputAudio) {
        //$log.log('EncoderFactory.load inputAudio.byteLength:' + inputAudio.byteLength);

        deferred = $q.defer();
        encoder.postMessage({'cmd':'load', 'inputAudio':inputAudio}, [inputAudio]);
        return deferred.promise;
    };

    Service.flush = function() {
        $log.log('EncoderFactory.js :: flush');

        deferred = $q.defer();
        encoder.postMessage({'cmd':'flush'});
        return deferred.promise;
    };

    Service.dispose = function() {
        $log.log('EncoderFactory.js :: dispose');

        encoder.postMessage({'cmd':'dispose'});
    };

    return Service;
};
