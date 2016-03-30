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

            case 'compressComplete':
                var encodedBuffer = e.data.encodedBuffer;
                if(encodedBuffer) {
                    deferred.resolve(new Blob([encodedBuffer], { type: 'audio/mp4' }));
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

    Service.init = function (format, sampleRate) {
        $log.log('EncoderFactory.init format:' + format + ', sampleRate:' + sampleRate);

        //TODO: figure out a better way to make this reference through browserify to get the javascript properly loaded as a webworker
        //https://github.com/substack/webworkify

        encoder = new Worker('/js/encoder.js');
        encoder.onmessage = workerOnMessage;
        encoder.onerror = workerOnError;

        deferred = $q.defer();
        encoder.postMessage({'cmd':'init', 'inputFormat':format, 'inputSampleRate':sampleRate, 'outputFormat':'mp4', 'outputBitrate':'32000'});
        return deferred.promise;
    };

    Service.compress = function(pcmBuffer) {
        $log.log('EncoderFactory.compress pcmBuffer.byteLength:' + pcmBuffer.byteLength);

        deferred = $q.defer();
        encoder.postMessage({'cmd':'compress', 'pcmBuffer':pcmBuffer}, [pcmBuffer]);
        return deferred.promise;
    };

    Service.exit = function() {
        $log.log('EncoderFactory.exit');

        encoder.postMessage({'cmd':'exit'});
    };

    return Service;
};
