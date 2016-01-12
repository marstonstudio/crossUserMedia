module.exports = function ($log, ffmpegaac) {

    var Service = {};

    Service.encodeWavToMp4 = function(wavBlob) {
        $log.info('wavBlob size:' + wavBlob.size);

        return wavBlob;
    };

    return Service;
};
