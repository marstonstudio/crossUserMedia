describe("Encoder", function() {

    //TODO: use optimized file location index.js.mem
    var FfmpegAAC = require('../dist/index.js');    //relative to spec file

    it("test encoding", function() {
        var NodeFS = require('fs');
        var inputFile = NodeFS.readFileSync('spec/input.wav');   //relative to location where you run npm test
        var inputData = new Uint8Array(inputFile);

        var outputData = new FfmpegAAC(inputData, '32k');
        NodeFS.writeFileSync('spec/output.mp4', new Buffer(outputData));

        //TODO: assert that output file is larger than input file
    });

});