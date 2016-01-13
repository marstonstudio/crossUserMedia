function FfmpegAAC(inputData, bitrate) {

    //TODO: WARNING: empkg-config not found, library detection may fail.
    //TODO: ./configure: line 4695: emnm: command not found

    //TODO: switch to web worker
    //TODO: npm centric build.sh
    //TODO: use device to stream PCM data instead of batch file

    //TODO: add asserts on input that we get a valid bitrate and Uint8Array
    //TODO: add documentation

    var _inputData = inputData;
    var _bitrate = bitrate;

    var _fileName = (0|Math.random()*9e6).toString(36);
    var _inputName = _fileName + '.wav';
    var _outputName = _fileName + '.mp4';

    var Module = {};

    Module['print'] = function(text) { console.log('stdout: ' + text); };

    Module['printErr'] = function(text) { console.error('stderr: ' + text); };

    Module['preRun'] = function() {
        console.log('ffmpegaac postRun input data length: ' + _inputData.length);

        var inputFile = FS.open(_inputName, "w+");
        FS.write(inputFile, _inputData, 0, _inputData.length);
        FS.close(inputFile);
    };

    Module['arguments'] = [
        '-i', _inputName,
        '-b:a', _bitrate,
        '-strict', '-2',
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

        Module['return'] = outputData;
    }

    /*EMSCRIPTENBODY*/

    return Module['return'];
}

module.exports = FfmpegAAC;