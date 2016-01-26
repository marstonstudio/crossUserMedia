module.exports = function ($log, ffmpegaac) {

    var Service = {};

    Service.encodeWavToMp4 = function(wavBuffer) {
        //assert(typeof wavBuffer === "string");

        $log.info('wavBuffer type: ' + typeof wavBuffer + ', wavBuffer.size: ' + wavBuffer.size);

        var mp4Buffer = new ffmpegaac(wavBuffer, '32k');
        for(var key in mp4Buffer) {
            $log.warn('key: ' + key + ', value: ' + mp4Buffer[key]);
        }

        $log.info('mp4Buffer type: ' + typeof mp4Buffer + ', mp4Buffer.size: ' + mp4Buffer.size);

        return mp4Buffer;
    };

    return Service;
};
