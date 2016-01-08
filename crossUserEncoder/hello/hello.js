function AACEncoder(bitrate, inputName, inputData) {

    var _encodedOutput;
    var _bitrate = bitrate;
    var _inputData = inputData;
    var _inputName = inputName;

    var Module = {};

    Module['arguments'] = [
        '-version'
    ]



    Module['preRun'] = function() {
        console.log('preRun');

        FS.mkdir('/data');
        FS.chdir('/data');

        var inputFile = FS.open(_inputName, "w+");
        FS.write(inputFile, _inputData, 0, _inputData.length);
        FS.close(inputFile);
    };


    /*EMSCRIPTENBODY*/

    return _encodedOutput;
}

module.exports = AACEncoder;