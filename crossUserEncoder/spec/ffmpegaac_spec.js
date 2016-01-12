describe("FfmpegAAC", function() {

    var fs = require('fs');

    //using js.mem optimization requires that js and js.mem files be present in the test execution directory
    //smelly and fragile, but limitation of emscripten output
    //see https://github.com/kripken/emscripten/issues/2537
    var FfmpegAAC = require('../index.js');

    it("test encoded output file smaller than input file", function() {

        var inputPath = 'spec/input.wav';
        var inputStats = fs.statSync(inputPath);
        expect(inputStats.size).toBeGreaterThan(100000);

        var inputFile = fs.readFileSync(inputPath);
        var inputData = new Uint8Array(inputFile);

        var outputPath = 'spec/output.mp4';
        var outputData = new FfmpegAAC(inputData, '32k');
        fs.writeFileSync(outputPath, new Buffer(outputData));

        var outputStats = fs.statSync(outputPath);
        expect(outputStats.size).toBeGreaterThan(10000);
        expect(outputStats.size * 5).toBeLessThan(inputStats.size);
    });

});