function AACEncoder(bitrate, inputName, inputData) {

    var _encodedOutput;
    var _bitrate = bitrate;
    var _inputData = inputData;
    var _inputName = '/data/' + inputName;
    var _outputName = '/data/output.mp4';

    var Module = {};

    Module['print'] = function(text) { console.log('stdout: ' + text); };

    Module['printErr'] = function(text) { console.error('stderr: ' + text); };

    Module['preRun'] = function() {
        FS.mkdir('/data');

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
        console.log('postRun');
    }

    /*EMSCRIPTENBODY*/

    return _encodedOutput;
}

module.exports = AACEncoder;