module.exports = function ($log, $q, encoderjs) {

    var Service = {};

    var encoder;
    var deferred;
    
    var workerOnMessage = function(e) {
        
        $log.log('EncoderFactory onmessage cmd:' + e.data.cmd);

        switch(e.data.cmd) {

            case 'initComplete':
                deferred.resolve();
                break;

            case 'loadComplete':
                deferred.resolve();
                break;

            case 'flushComplete':
                if(e.data.outputBuffer) {
                    var blob = new Blob([e.data.outputBuffer], { type: 'audio/' + e.data.outputFormat });
                    deferred.resolve({
                        'format':e.data.outputFormat,
                        'sampleRate':e.data.outputSampleRate,
                        'blob':blob
                    });
                } else {
                    deferred.reject('EncoderFactory no data received');
                }
                break;
            
            default:
                $log.error('EncoderFactory unknown command ' + e.data.cmd);
        }
    };

    var workerOnError = function(e) {
        $log.error('EncoderFactory listener error ' + e.filename + ' line:' + e.lineno + ' ' + e.message);
    };

    Service.init = function (inputFormat, inputSampleRate, outputFormat) {
        $log.log('EncoderFactory.init inputFormat:' + inputFormat + ', inputSampleRate:' + inputSampleRate + ', outputFormat:' + outputFormat);

        //TODO: figure out a better way to make this reference through browserify to get the javascript properly loaded as a webworker https://github.com/substack/webworkify
        encoder = new Worker('/js/encoder.js');
        encoder.onmessage = workerOnMessage;
        encoder.onerror = workerOnError;

        deferred = $q.defer();
        encoder.postMessage({
            'cmd':'init', 
            'inputFormat': inputFormat, 
            'inputSampleRate': inputSampleRate, 
            'outputFormat': outputFormat,
            'outputSampleRate': inputSampleRate,
            'outputBitRate': 32000
        });
        return deferred.promise;
    };

    Service.load = function(inputBuffer) {
        $log.log('EncoderFactory.load inputBuffer.byteLength:' + inputBuffer.byteLength);

        deferred = $q.defer();
        encoder.postMessage({'cmd':'load', 'inputBuffer':inputBuffer}, [inputBuffer]);
        return deferred.promise;
    };

    Service.flush = function() {
        $log.log('EncoderFactory.flush');

        deferred = $q.defer();
        encoder.postMessage({'cmd':'flush'});
        return deferred.promise;
    };

    Service.exit = function() {
        $log.log('EncoderFactory.exit');

        encoder.postMessage({'cmd':'exit'});
    };

    return Service;
};
