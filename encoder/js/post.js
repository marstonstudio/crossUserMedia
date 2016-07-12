this.onmessage = function(e) {

    switch(e.data.cmd) {

        case 'init':
            init(e.data.inputFormat, e.data.inputCodec, e.data.inputSampleRate, e.data.inputChannels, e.data.outputFormat, e.data.outputCodec, e.data.outputSampleRate, e.data.outputChannels, e.data.outputBitRate, e.data.maxSeconds);
            break;
        
        case 'load':
            load(e.data.inputAudio);
            break;

        case 'dispose':
            dispose();
            break;

        default:
            console.error('encoder.js unknown command ' + e.data.cmd);
    };
};

this.onerror = function(e) {
    console.error('encoder.js worker error: ' + e);
}

var init = function(inputFormat, inputCodec, inputSampleRate, inputChannels, outputFormat, outputCodec, outputSampleRate, outputChannels, outputBitRate, maxSeconds) {
    console.log('encoder.js :: init inputFormat:' + inputFormat + ', inputCodec:' + inputCodec + ', inputSampleRate:' + inputSampleRate + ', inputChannels:' + inputChannels
                            + ', outputFormat:' + outputFormat + ', outputCodec:' + outputCodec +', outputSampleRate:' + outputSampleRate + ', outputChannels:' + outputChannels
                            + ', outputBitRate:' + outputBitRate + ", maxSeconds:" + maxSeconds);

    var status = Module.ccall(
        'init',
        'number',
        ['string', 'string', 'number', 'number', 'string', 'string', 'number', 'number', 'number', 'number'],
        [inputFormat, inputCodec, inputSampleRate, inputChannels, outputFormat, outputCodec, outputSampleRate, outputChannels, outputBitRate, maxSeconds]
    );

    self.postMessage({'cmd':'initComplete'});
};

var load = function(inputAudio) {
    if(inputAudio !== undefined) {
        console.log('encoder.js load byteLength:' + inputAudio.byteLength);
    } else {
        console.log('encoder.js load flushing');
    }

    var inputAudioArray = inputAudio !== undefined ? new Uint8Array(inputAudio) : new Uint8Array();
    var status = Module.ccall(
        'load',
        'number',
        ['array', 'number'],
        [inputAudioArray, inputAudioArray.length]
    );

    self.postMessage({'cmd':'loadComplete'});
};

var onFlushCallback = function() {
    console.log('encoder.js :: onFlushCallback');

    var outputPointer = Module.ccall('get_output_pointer', 'number');
    var outputLength = Module.ccall('get_output_length', 'number');
    var outputFormat = Module.ccall('get_output_format', 'string');
    var outputCodec = Module.ccall('get_output_codec', 'string');
    var outputSampleRate = Module.ccall('get_output_sample_rate', 'number');
    var outputChannels = Module.ccall('get_output_channels', 'number');

    var outputAudio = Module.HEAPU8.slice(outputPointer, outputPointer + outputLength);

    self.postMessage({
        'cmd':'flushComplete',
        'outputFormat':outputFormat,
        'outputCodec':outputCodec,
        'outputSampleRate':outputSampleRate,
        'outputChannels':outputChannels,
        'outputAudio':outputAudio.buffer},
        [outputAudio.buffer]
    );
}

var dispose = function() {
    console.log('encoder.js :: dispose');

    try {
        Module.ccall('dispose', null, ['number'], [0]);
        close();
    } catch(ex) {
        if(!(ex instanceof ExitStatus)) {
            throw ex;
        }
    }
};