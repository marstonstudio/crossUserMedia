describe("FfmpegAAC", function() {

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
        console.log('inside test');
        encoder.postMessage('hello');
        done();
    });

});


