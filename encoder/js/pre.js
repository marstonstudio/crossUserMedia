var Module = {};

Module['print'] = function(text) { 
    console.log('encoder.c ' + text);
};

Module['printErr'] = function(text) { 
    console.error('encoder.c ' + text);
};

//hack, necessary so memory optimizer can be found in browser
if(typeof window === "object") {
    Module["memoryInitializerPrefixURL"] = "/js/";
}