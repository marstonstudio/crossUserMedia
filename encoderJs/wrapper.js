var Module = {};

Module['print'] = function(text) { console.log(text); };

Module['printErr'] = function(text) { console.log(text); };

this.onmessage = function(e) {

    //TODO: ./configure: line 4920: emnm: command not found
    //TODO: WARNING: empkg-config not found, library detection may fail.

    //TODO: npm centric build.sh
    //TODO: use device to stream PCM data instead of batch file

    //TODO: add asserts on input that we get a valid bitrate and ArrayBuffer
    //TODO: add documentation
    //TODO: just use a pre.js ?
    //TODO: separate ASM from ffmpeg code

    var inputSampleRate = e.data.inputSampleRate;
    var inputFormat = e.data.inputFormat;
    var outputBitrate = e.data.outputBitrate;
    var pcmBuffer = e.data.pcmBuffer;

    console.log('encoderjs onmessage inputSampleRate:' + inputSampleRate + ', inputFormat:' + inputFormat + ', outputBitrate:' + outputBitrate + ', pcmBuffer.byteLength:' + pcmBuffer.byteLength);

    var fileName = (0|Math.random()*9e6).toString(36);
    var inputName = fileName + '.pcm';
    var outputName = fileName + '.mp4';

    Module['preRun'] = function() {
        var inputArray = new Uint8Array(pcmBuffer);
        var inputFile = FS.open(inputName, "w+");
        FS.write(inputFile, inputArray, 0, inputArray.length);
        FS.close(inputFile);
    };

    Module['arguments'] = [
        '-nostdin',
        '-stats',
        '-f', inputFormat,
        '-acodec', 'pcm_' + inputFormat,
        '-ar', inputSampleRate.toString(),
        '-ac', '1',
        '-channel_layout', 'mono',
        '-i', inputName,
        '-b:a', outputBitrate.toString(),
        '-f', 'mp4',
        '-acodec', 'aac',
        outputName
    ];

    Module['postRun'] = function() {
        var outputLength = FS.stat(outputName).size;
        console.log('encoderjs postRun output data length: ' + outputLength);

        var outputFile = FS.open(outputName, "r");
        var outputData = new Uint8Array(outputLength);
        FS.read(outputFile, outputData, 0, outputLength, 0);
        FS.close(outputFile);

        self.postMessage(outputData.buffer);
    }

    //hack, necessary so memory optimizer can be found in browser
    if(typeof window === "object") {
        Module["memoryInitializerPrefixURL"] = "/js/";
    }
}

this.onerror = function(e) {
    console.error('encoderjs worker error: ' + e);
}

/*EMSCRIPTENBODY*/