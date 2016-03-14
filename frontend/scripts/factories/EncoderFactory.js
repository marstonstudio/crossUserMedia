module.exports = function ($log, $q, encoderjs) {

    var Service = {};

    var initialized = false;
    //var supportTransferableObjects = true;

    Service.initialize = function () {
        if (initialized) {
            return;
        }

        // TODO:unclear if this is necessary, helped sniff out that flash implementation was not sending an actual buffer
        // http://www.html5rocks.com/en/tutorials/workers/basics/
        // https://developers.google.com/web/updates/2011/12/Transferable-Objects-Lightning-Fast?hl=en
        /*
        var blob = new Blob(['onmessage = function(e) {postMessage("worker " + e.data.message);};']);
        var blobUrl = window.URL.createObjectURL(blob);
        var worker = new Worker(blobUrl);

        var uint8Array = new Uint8Array(2);
        uint8Array[0] = 42;
        var arrayBuffer = uint8Array.buffer;
        $log.log('prior arrayBuffer.byteLength: ' + arrayBuffer.byteLength);

        worker.onmessage = function(e) {
            $log.log('callback ' + e.data + ' arrayBuffer.byteLength:' + arrayBuffer.byteLength);
            if(arrayBuffer.byteLength) {
                $log.warn('transferable objects not supported');
                supportTransferableObjects = false;
            } else {
                $log.log('transferable objects supported');
                supportTransferableObjects = true;
            }
            worker.terminate();
        };
        worker.postMessage({'message':'test', 'buffer':arrayBuffer}, [arrayBuffer]);
        */

        initialized = true;
    };

    Service.process = function(sampleRate, format, pcmBuffer) {
        $log.log('EncoderFactory sampleRate:' + sampleRate + ', format:' + format + ', pcmBuffer.byteLength:' + pcmBuffer.byteLength);

        var startTime = new Date();
        var deferred = $q.defer();

        //TODO: figure out a better way to make this reference through browserify to get the javascript properly loaded as a webworker
        //https://github.com/substack/webworkify
        var encoder = new Worker('/js/encoder.js');
        encoder.onmessage = function(e) {
            $log.debug('EncoderFactory listener result in ' + (new Date() - startTime) / 1000 + ' seconds');

            var encodedBuffer = e.data;
            if(encodedBuffer) {
                deferred.resolve(new Blob([encodedBuffer], { type: 'audio/mp4' }));
            } else {
                deferred.reject('EncoderFactory no data received');
            }
        };
        encoder.onerror = function(e) {
            $log.error('EncoderFactory listener error: ' + e.message);
        };

        encoder.postMessage({'inputSampleRate':sampleRate, 'inputFormat':format, 'outputBitrate':'32k', 'pcmBuffer':pcmBuffer}, [pcmBuffer]);

        return deferred.promise;
    };

    return Service;
};
