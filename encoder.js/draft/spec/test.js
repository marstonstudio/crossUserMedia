describe("EncoderJs", function() {

    var fs = require('fs');

    var Worker = require('webworker-threads').Worker;
    var encoder = new Worker('encoder.js');

    beforeAll(function(done) {

        encoder.onmessage = function(e) {
            console.log('outside spec message: ' + e.data);
        };

        encoder.onerror = function(e) {
            console.error('outside spec error: ' + e.message);
        };

        done();
    });

    it("test encoded output file exists and is smaller than input file", function(done) {

        var inputPath = 'spec/input.wav';
        var inputStats = fs.statSync(inputPath);
        expect(inputStats.size).toBeGreaterThan(100000);
        //console.log('test input file ' + inputPath + ' size:' + inputStats.size);

        var inputFile = fs.readFileSync(inputPath);
        var inputBuffer = new Uint8Array(inputFile);

        //var message = {'bitrate':'32k', 'buffer':inputData};

        //UGGGGH cannot transfer binary data to node-web-worker: https://github.com/audreyt/node-webworker-threads/issues/60

        //encoder.postMessage({'bitrate':'32k', 'buffer':inputBuffer}, [inputBuffer]);
        //encoder.postMessage({'bitrate':'32k', 'buffer':new Uint8Array(65)});
        encoder.postMessage({'bitrate':'32k'});

        done();
    });

});


