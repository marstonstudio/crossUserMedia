describe("Encoder", function() {

    var AACEncoder = require('../dist/index.js');    //relative to spec file

    it("test encoding", function() {
        var NodeFS = require('fs');
        var inputWav = NodeFS.readFileSync('spec/input.wav');   //relative to location where you run npm test
        var inputUint8 = new Uint8Array(inputWav);
        console.log('inputUint8.length: ' + inputUint8.length);

        var aacEncoder = new AACEncoder('32k', 'input.wav', inputUint8);
    });

});