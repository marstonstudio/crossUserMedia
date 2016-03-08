module.exports = function ($log, $q) {

    var Service = {};

    var initialized = false;
    var supportTransferableObjects = true;


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
        $log.info('prior arrayBuffer.byteLength: ' + arrayBuffer.byteLength);

        worker.onmessage = function(e) {
            $log.info('callback ' + e.data + ' arrayBuffer.byteLength:' + arrayBuffer.byteLength);
            if(arrayBuffer.byteLength) {
                $log.warn('transferable objects not supported');
                supportTransferableObjects = false;
            } else {
                $log.info('transferable objects supported');
                supportTransferableObjects = true;
            }
            worker.terminate();
        };
        worker.postMessage({'message':'test', 'buffer':arrayBuffer}, [arrayBuffer]);
        */

        initialized = true;
    };

    Service.encodeBufferToBlob = function(wavBuffer) {

        $log.info('EncoderFactory wavBuffer.byteLength:' + wavBuffer.byteLength);

        var deferred = $q.defer();

        var encoder = new Worker('/js/encoder.js');
        encoder.onmessage = function(e) {
            $log.info('EncoderFactory worker listener result');

            var encodedBuffer = e.data;
            var encodedBlob = new Blob([encodedBuffer], { type: 'audio/wav' });

            deferred.resolve(encodedBlob);
        };
        encoder.onerror = function(e) {
            $log.error('EncoderFactory worker listener error: ' + e.message);
        };

        if(supportTransferableObjects) {
            encoder.postMessage({'bitrate':'32k', 'buffer':wavBuffer}, [wavBuffer]);
        } else {
            encoder.postMessage({'bitrate':'32k', 'buffer':wavBuffer});
        }

        return deferred.promise;
    };

    return Service;
};
