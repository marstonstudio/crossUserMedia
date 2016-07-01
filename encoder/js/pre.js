var Module = {};

Module['print'] = function(text) { 
    console.log('encoder.c ' + text);
};

Module['printErr'] = function(text) { 
    console.error('encoder.c ' + text);
};

Module['onRuntimeInitialized'] = function() {
    self.postMessage({'cmd':'prepareComplete'});
}