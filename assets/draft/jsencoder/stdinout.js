var FfmpegAac = function(bitrate) {

    var _bitrate = bitrate;
    var _outputData = [];

    var inputIndex = 0;

    var Module = {};

    Module['print'] = function(text) {
        console.log(text);
    };

    Module['printErr'] = function(text) {
        console.log(text);
    };

    var stdin = function() {
        console.log('stdin: ' + inputIndex);
        return inputIndex < inputData.length ? inputData[inputIndex++] : null
    };

    var stdout = function(value) {
        console.log('stdout: ' + value);
        if (value !== null) _outputData.push(value);
    };

    var stderr = function(message) {
        console.log('stderr: ' +  message);
    };

    Module['prerun'] = function() {
        console.log('prerun');

        FS.init(stdin, stdout, stderr);
    };

    Module['arguments'] = [
        '-strict', '-2',
        '-i', 'pipe:',
        '-f', 'mp4',
        '-movflags', 'frag_keyframe+empty_moov',
        '-b:a', _bitrate,
        'pipe:'
    ];

    if(typeof window === "object") {
        Module["memoryInitializerPrefixURL"] = "/js/";
    }

    /*EMSCRIPTENBODY*/

    this.encode = function(inputData) {
        console.log('encode');
    };

    this.output = function() {
        return _outputData;
    };

};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = FfmpegAac;
}