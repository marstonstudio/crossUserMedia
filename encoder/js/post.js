var initEncoder = Module.cwrap('init', null, ['number', 'number', 'number', 'number', 'number']);

var forceExitEncoder = Module.cwrap('force_exit', null, ['number']);

var inputFormatBuffer;
var outputFormatBuffer;

//TODO: draft to get worker properly integrated
var passThruBuffer;

//FIXME: remove this state, pass through to C and get back without storing locally in worker
var outputFormat;
var outputSampleRate;
var outputBitRate;

this.onmessage = function(e) {
    
    //console.log('encoder.js onmessage cmd:' + e.data.cmd);

    switch(e.data.cmd) {

        case 'init':
            
            var inputFormat = e.data.inputFormat;
            inputFormatBuffer = Module._malloc(inputFormat.length+1);
            Module.writeStringToMemory(inputFormat, inputFormatBuffer);
            
            outputFormat = e.data.outputFormat;
            outputFormatBuffer = Module._malloc(outputFormat.length+1);
            Module.writeStringToMemory(outputFormat, outputFormatBuffer);

            var inputSampleRate = e.data.inputSampleRate;
            outputSampleRate = e.data.outputSampleRate;
            outputBitRate = e.data.outputBitRate;
            
            console.log('encoder.js init inputFormat:' + inputFormat + ', inputSampleRate:' + inputSampleRate + 
                ', outputFormat:' + outputFormat + ', oustputSampleRate:' + outputSampleRate + ', outputBitRate:' + outputBitRate);
            
            initEncoder(inputFormatBuffer, inputSampleRate, outputFormatBuffer, outputSampleRate, outputBitRate);
            self.postMessage({'cmd':'initComplete'});
            
            break;
        
        case 'load':

            console.log('encoder.js load inputBuffer.byteLength:' + e.data.inputBuffer.byteLength);

            passThruBuffer = e.data.inputBuffer.slice();
            self.postMessage({'cmd':'loadComplete'});
            break;

        case 'flush':

            console.log('encoder.js flush');

            self.postMessage({
                'cmd':'flushComplete',
                'outputFormat':outputFormat,
                'outputSampleRate':outputSampleRate,
                'outputBuffer':passThruBuffer},
                [passThruBuffer]);
            break;

        case 'exit':

            try {
                Module._free(inputFormatBuffer);
                Module._free(outputFormatBuffer);
                forceExitEncoder(0);
                close();
            } catch(ex) {
                if(!(ex instanceof ExitStatus)) {
                    throw ex;
                }
            }
            break;

        default:
            console.error('encoder.js unknown command ' + e.data.cmd);

    };
};

this.onerror = function(e) {
    console.error('encoder.js worker error: ' + e);
}

/*
 var fileName = (0|Math.random()*9e6).toString(36);
 var inputName = fileName + '.pcm';
 var outputName = fileName + '.mp4';

 var inputArray = new Uint8Array(pcmBuffer);
 var inputFile = FS.open(inputName, "w+");
 FS.write(inputFile, inputArray, 0, inputArray.length);
 FS.close(inputFile);

 var outputFile = FS.open(outputName, "r");
 var outputData = new Uint8Array(outputLength);
 FS.read(outputFile, outputData, 0, outputLength, 0);
 FS.close(outputFile);

 self.postMessage(outputData.buffer);
 */




