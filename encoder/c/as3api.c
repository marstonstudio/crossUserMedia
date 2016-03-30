#include <stdlib.h>
#include "AS3/AS3.h"

void compress() __attribute__((
        used,
        annotate("as3sig:public function compress(keystr:String):uint"),
        annotate("as3package:com.marstonstudio.crossusermedia.encoder")
    ));

void compress() {

    char *key = NULL;
    AS3_MallocString(key, keystr);

    int keylen = 0;
    AS3_StringLength(keylen, keystr);

    // Call hash function
    int result = 42;

    // don't forget to free the string we allocated with malloc previously
    free(key);

    // return the result (using an AS3 return rather than a C/C++ return)
    AS3_Return(result);
}