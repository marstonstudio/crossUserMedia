describe("Encoder", function() {

    var NodeFS = require('fs');
    var inputWav = NodeFS.readFileSync('spec/input.wav');   //relative to location where you run npm test
    var inputUint8 = new Uint8Array(inputWav);
    console.log('inputUint8.length: ' + inputUint8.length);

    var AACEncoder = require('../dist/index.js');    //relative to spec file

    //var wavBlob = new Blob([ wavBuffer ], { type: 'audio/wav' });
    //console.log('wavBlob.size' + wavBlob.size);

    it("should test here", function() {

        var aacEncoder = new AACEncoder('32k', 'input.wav', inputUint8);

        console.log("inside it");
    });

});