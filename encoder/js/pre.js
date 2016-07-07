var Module = {};

Module['print'] = function(text) { 
    console.log('encoder.c ' + text);
};

Module['printErr'] = function(text) { 
    console.error('encoder.c ' + text);
};

Module['onRuntimeInitialized'] = function() {
    console.log('encoder.js :: ready :: build 2016-07-06 - 9:17pm');
    self.postMessage({'cmd':'prepareComplete'});
}