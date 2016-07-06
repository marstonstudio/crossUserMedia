var Module = {};

Module['print'] = function(text) { 
    console.log('encoder.c ' + text);
};

Module['printErr'] = function(text) { 
    console.error('encoder.c ' + text);
};

Module['onRuntimeInitialized'] = function() {
    console.log('encoder.js prepared');
    self.postMessage({'cmd':'prepareComplete'});
}