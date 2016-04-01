var initEncoder = Module.cwrap('init', null, ['number', 'number', 'number', 'number']);

var forceExitEncoder = Module.cwrap('force_exit', null, ['number']);

var inputFormatBuffer;
var outputFormatBuffer;

var passThruBuffer;

this.onmessage = function(e) {
    
    console.log('encoder.js onmessage cmd:' + e.data.cmd);

    switch(e.data.cmd) {

        case 'init':

            var inputFormat = e.data.inputFormat;
            inputFormatBuffer = Module._malloc(inputFormat.length+1);
            Module.writeStringToMemory(inputFormat, inputFormatBuffer);
            var inputSampleRate = e.data.inputSampleRate;

            var outputFormat = e.data.outputFormat;
            outputFormatBuffer = Module._malloc(outputFormat.length+1);
            Module.writeStringToMemory(outputFormat, outputFormatBuffer);
            var outputBitrate = e.data.outputBitrate

            //console.log('encoder.js inputFormat:' + inputFormat + ', inputSampleRate:' + inputSampleRate + ', outputFormat:' + outputFormat + ', outputBitrate:' + outputBitrate);

            initEncoder(inputFormatBuffer, inputSampleRate, outputFormatBuffer, outputBitrate);
            self.postMessage({'cmd':'initComplete'});
            
            break;
        
        case 'load':

            passThruBuffer = e.data.pcmBuffer;
            self.postMessage({'cmd':'loadComplete'});
            break;

        case 'flush':

            self.postMessage({'cmd':'flushComplete', 'encodedBuffer':passThruBuffer}, [passThruBuffer]);
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




