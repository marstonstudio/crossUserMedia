this.onmessage = function(e) {

    var bitrate = e.data.bitrate;
    var buffer = e.data.buffer;
    console.log('encoding at bitrate:' + bitrate);


    //var buffer = e.data.buffer;

    //console.log('encoding at bitrate:' + bitrate + ' buffer length ' + buffer.length);


    //self.postMessage(buffer);
    self.postMessage('done');
    self.close();

    /*
    var data = e.data;
    switch(data.cmd) {

        case 'initialize':
            _bitrate = data.msg;
            self.postMessage('initialized with bitrate: ' + _bitrate);
            break;

        case 'encode':
            _buffer = data.buffer;
            self.postMessage('encoding buffer at bitrate: ' + _bitrate);
            break;

        default:
            self.postMessage('unknown command ' + data.cmd);
    };
    */
}

this.onerror = function(e) {
    console.error('inside worker error: ' + e.message);
}