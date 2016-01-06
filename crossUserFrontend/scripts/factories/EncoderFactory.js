module.exports = function ($log, aacencoder) {

    var Service = {};

    Service.encodeWavToMp4 = function(wavBlob) {
        $log.info('wavBlob size:' + wavBlob.size);

        return wavBlob;
    };

    return Service;
};
