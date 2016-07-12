module.exports = function ($log, $q, pcmencoder) {

    var Service = {};

    var encoder;

    var deferredPrepare;
    var deferredInit;
    var deferredLoad;
    var deferredFlush;
    
    var workerOnMessage = function(e) {
        //$log.log('EncoderFactory.js :: workerOnMessage cmd:' + e.data.cmd);

        switch(e.data.cmd) {
            
            case 'prepareComplete':
                deferredPrepare.resolve();
                break;

            case 'initComplete':
                deferredInit.resolve();
                break;

            case 'loadComplete':
                deferredLoad.resolve();
                break;

            case 'flushComplete':
                if(e.data.outputAudio) {
                    var blob = new Blob([e.data.outputAudio], { type: 'audio/' + e.data.outputFormat });
                    deferredFlush.resolve({
                        'format':e.data.outputFormat,
                        'codec':e.data.outputCodec,
                        'sampleRate':e.data.outputSampleRate,
                        'channels':e.data.outputChannels,
                        'blob':blob
                    });
                    
                } else {
                    deferredFlush.reject('EncoderFactory.js :: no data received');
                }
                encoder.postMessage({'cmd':'dispose'});
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

        deferredPrepare = $q.defer();
        encoder = new Worker('/js/encoder.js');
        encoder.onmessage = workerOnMessage;
        encoder.onerror = workerOnError;
        return deferredPrepare.promise;
    };

    Service.init = function (inputFormat, inputCodec, inputSampleRate, inputChannels, outputFormat, outputCodec, outputSampleRate, outputChannels, outputBitRate, maxSeconds) {
        //$log.log('EncoderFactory.js :: init');

        deferredInit = $q.defer();
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
        return deferredInit.promise;
    };

    Service.load = function(inputAudio) {
        //$log.log('EncoderFactory.load');

        if(inputAudio !== undefined) {
            deferredLoad = $q.defer();
            encoder.postMessage({'cmd':'load', 'inputAudio':inputAudio}, [inputAudio]);
            return deferredLoad.promise;

        } else {
            deferredFlush = $q.defer();
            encoder.postMessage({'cmd':'load'});
            return deferredFlush.promise;
        }
    };

    return Service;
};
