this.onmessage = function(e) {

    var bitrate = e.data.bitrate;
    var buffer = e.data.buffer;

    console.log('EncoderFactory inside encoding at bitrate:' + bitrate + ', buffer.byteLength: ' + buffer.byteLength);

    var output = new ArrayBuffer(buffer.byteLength);
    new Uint8Array(output).set(new Uint8Array(buffer));

    self.postMessage(output);
    self.close();
}

this.onerror = function(e) {
    console.error('EncoderFactory inside error: ' + e.message);
}