var Module = {};

Module['print'] = function(text) { 
    console.log('encoder.c ' + text);
};

Module['printErr'] = function(text) { 
    console.error('encoder.c ' + text);
};

Module['onRuntimeInitialized'] = function() {
    //console.log('encoder.js :: prepared');
    self.postMessage({'cmd':'prepareComplete'});
}

//hack, necessary so memory optimizer and pthread script can be found in browser
if(ENVIRONMENT_IS_WEB) {
    Module['memoryInitializerPrefixURL'] = '/js/';
};