this.onmessage = function(e) {

    switch(e.data.cmd) {

        case 'init':
            init(e.data.inputFormat, e.data.inputSampleRate, e.data.outputFormat, e.data.outputSampleRate, e.data.outputBitRate);
            break;
        
        case 'load':
            load(e.data.inputAudio);
            break;

        case 'flush':
            flush();
            break;

        case 'exit':
            forceExit();
            break;

        default:
            console.error('encoder.js unknown command ' + e.data.cmd);
    };
};

this.onerror = function(e) {
    console.error('encoder.js worker error: ' + e);
}

var init = function(inputFormat, inputSampleRate, outputFormat, outputSampleRate, outputBitRate) {
    console.log('encoder.js init inputFormat:' + inputFormat + ', inputSampleRate:' + inputSampleRate + ', outputFormat:' + outputFormat + ', outputSampleRate:' + outputSampleRate + ', outputBitRate:' + outputBitRate);

    var inputFormatBuffer = Module._malloc(inputFormat.length+1);
    Module.writeStringToMemory(inputFormat, inputFormatBuffer);

    var outputFormatBuffer = Module._malloc(outputFormat.length+1);
    Module.writeStringToMemory(outputFormat, outputFormatBuffer);

    Module.ccall(
        'init',
        null,
        ['number', 'number', 'number', 'number', 'number'],
        [inputFormatBuffer, inputSampleRate, outputFormatBuffer, outputSampleRate,  outputBitRate]
    );

    Module._free(inputFormatBuffer);
    Module._free(outputFormatBuffer);

    self.postMessage({'cmd':'initComplete'});
};

var load = function(inputAudio) {
    console.log('encoder.js load inputAudio.byteLength:' + inputAudio.byteLength);

    var inputAudioArray = new Uint8Array(inputAudio);
    var inputAudioBuffer = Module._malloc(inputAudioArray.length);
    Module.writeArrayToMemory(inputAudioArray, inputAudioBuffer);
    Module.ccall(
        'load',
        null,
        ['number', 'number'],
        [inputAudioBuffer, inputAudioArray.length]
    );

    Module._free(inputAudioBuffer);

    self.postMessage({'cmd':'loadComplete'});
};

var flush = function() {
    console.log('encoder.js flush');

    var outputFormat = Module.ccall('get_output_format', 'string');
    var outputSampleRate = Module.ccall('get_output_sample_rate', 'number');
    var outputLength = Module.ccall('get_output_length', 'number');
    var outputAudioPointer = Module.ccall('flush', 'number');

    var outputAudioArray = new Uint8Array(outputLength);
    for(i=0; i<outputLength; i++) {
        var outputByte = Module.getValue(outputAudioPointer + i);
        outputAudioArray.set([outputByte], i);
    }
    
    self.postMessage({
        'cmd':'flushComplete',
        'outputFormat':outputFormat,
        'outputSampleRate':outputSampleRate,
        'outputAudio':outputAudioArray.buffer},
        [outputAudioArray.buffer]
    );
};

var forceExit = function() {
    console.log('encoder.js forceExit');

    try {
        Module.ccall(
            'force_exit',
            null,
            ['number'],
            [0]
        );
        close();
    } catch(ex) {
        if(!(ex instanceof ExitStatus)) {
            throw ex;
        }
    }
};