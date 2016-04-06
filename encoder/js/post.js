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

    Module.ccall(
        'init',
        null,
        ['string', 'number', 'string', 'number', 'number'],
        [inputFormat, inputSampleRate, outputFormat, outputSampleRate,  outputBitRate]
    );

    self.postMessage({'cmd':'initComplete'});
};

var load = function(inputAudio) {
    //console.log('encoder.js load inputAudio.byteLength:' + inputAudio.byteLength);

    var inputAudioArray = new Uint8Array(inputAudio);
    Module.ccall(
        'load',
        null,
        ['array', 'number'],
        [inputAudioArray, inputAudioArray.length]
    );

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

//hack, necessary so memory optimizer can be found in browser
if(ENVIRONMENT_IS_WEB) {
    Module["memoryInitializerPrefixURL"] = "/js/";
}