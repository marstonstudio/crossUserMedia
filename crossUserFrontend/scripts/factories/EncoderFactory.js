module.exports = function ($log, ffmpeg) {

    var Service = {};

    Service.encodeWavToMp4 = function(wavBlob) {
        $log.info('wavBlob size:' + wavBlob.size);

        return wavBlob;
    };

    return Service;
};
