this.onmessage = function(e) {
    var inputSampleRate = e.data.inputSampleRate;
    var inputFormat = e.data.inputFormat;
    var outputBitrate = e.data.outputBitrate;
    var pcmBuffer = e.data.pcmBuffer;

    console.log('encoderjs onmessage inputSampleRate:' + inputSampleRate + ', inputFormat:' + inputFormat + ', outputBitrate:' + outputBitrate + ', pcmBuffer.byteLength:' + pcmBuffer.byteLength);

    self.postMessage('done');
}

this.onerror = function(e) {
    console.error('encoderjs worker error: ' + e);
}