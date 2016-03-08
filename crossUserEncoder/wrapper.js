var Module = {};

Module['print'] = function(text) { console.log(text); };

Module['printErr'] = function(text) { console.log(text); };

this.onmessage = function(e) {

    //TODO: ./configure: line 4920: emnm: command not found
    //TODO: WARNING: empkg-config not found, library detection may fail.

    //TODO: npm centric build.sh
    //TODO: use device to stream PCM data instead of batch file
    //TODO: use worker specific filesystem
    //TODO: can we just use ArrayBuffer instead of Uint8Array conversion?

    //TODO: add asserts on input that we get a valid bitrate and ArrayBuffer
    //TODO: add documentation
    //TODO: just use a pre.js ?

    var _bitrate = e.data.bitrate;
    var _pcm = new Uint8Array(e.data.pcm);
    console.log('ffmpegaac onmessage bitrate:' + _bitrate + ', pcm.byteLength:' + e.data.pcm.byteLength)

    var _fileName = (0|Math.random()*9e6).toString(36);
    var _inputName = _fileName + '.wav';
    var _outputName = _fileName + '.mp4';

    Module['preRun'] = function() {
        console.log('ffmpegaac preRun input data length: ' + _pcm.length);

        var inputFile = FS.open(_inputName, "w+");
        FS.write(inputFile, _pcm, 0, _pcm.length);
        FS.close(inputFile);
    };

    Module['arguments'] = [
        '-i', _inputName,
        '-b:a', _bitrate,
        '-nostdin',
        _outputName
    ];

    Module['postRun'] = function() {
        var outputLength = FS.stat(_outputName).size;
        console.log('ffmpegaac postRun output data length: ' + outputLength);

        var outputFile = FS.open(_outputName, "r");
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
    console.error('EncoderFactory worker error: ' + e.message);
}

/*EMSCRIPTENBODY*/