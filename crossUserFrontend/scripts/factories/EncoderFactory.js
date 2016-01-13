module.exports = function ($log, ffmpegaac) {

    var Service = {};

    Service.encodeWavToMp4 = function(wavBuffer) {
        //$log.info('wavBuffer size:' + wavBuffer.size);

        var mp4Buffer = new ffmpegaac(wavBuffer, '32k');

        return mp4Buffer;
    };

    return Service;
};
