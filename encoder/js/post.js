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

var loadQueue = [];
var loadCalls = 0;

var init = function(inputFormat, inputCodec, inputSampleRate, inputChannels, outputFormat, outputCodec, outputSampleRate, outputChannels, outputBitRate, maxSeconds) {
    console.log('encoder.js :: init inputFormat:' + inputFormat + ', inputCodec:' + inputCodec + ', inputSampleRate:' + inputSampleRate + ', inputChannels:' + inputChannels
                            + ', outputFormat:' + outputFormat + ', outputCodec:' + outputCodec +', outputSampleRate:' + outputSampleRate + ', outputChannels:' + outputChannels
                            + ', outputBitRate:' + outputBitRate + ", maxSeconds:" + maxSeconds);

    loadQueue.length = 0;
    loadCalls = 0;
    
    var status = Module.ccall(
        'init',
        'number',
        ['string', 'string', 'number', 'number', 'string', 'string', 'number', 'number', 'number', 'number'],
        [inputFormat, inputCodec, inputSampleRate, inputChannels, outputFormat, outputCodec, outputSampleRate, outputChannels, outputBitRate, maxSeconds]
    );

    self.postMessage({'cmd':'initComplete'});
};

var load = function(inputAudio) {
    var inputAudioBytes = inputAudio !== undefined ? new Uint8Array(inputAudio) : new Uint8Array();
    console.log('encoder.js load byteLength:' + inputAudioBytes.byteLength + ', loadQueue.length:' + loadQueue.length + ', calls:' + ++loadCalls);

    loadQueue.push(inputAudioBytes);
    executeLoad();
};

var executeLoad = function() {
    
    var loadLocked = Module.ccall('get_load_locked_status', 'number');
    if (!loadLocked && loadQueue.length > 0) {
        
        var inputAudioBytes = loadQueue.shift();
        var status = Module.ccall(
            'load',
            'number',
            ['array', 'number'],
            [inputAudioBytes, inputAudioBytes.length]
        );
        
        //was in fact loadLocked, put the inputAudio back
        if(status === 1) {
            loadQueue.unshift(inputAudioBytes);
            
        //called with inputAudioBytes.length === 0 to trigger flush   
        } else if(inputAudioBytes.length === 0) {
            executeFlushComplete();
            
        } else {
            self.postMessage({'cmd':'loadComplete'});
            if(loadQueue.length > 0) {
                executeLoad();
            }
        }
    }
}

var executeFlushComplete = function() {
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