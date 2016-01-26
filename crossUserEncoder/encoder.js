this.onmessage = function(e) {
    console.log('inside worker message: ' + e.data);
    postMessage('world');
    self.close();
}

this.onerror = function(e) {
    console.error('inside worker error: ' + e.message);
}