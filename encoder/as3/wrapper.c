#include <stdlib.h>
#include "AS3/AS3.h"

void wrapper_init() __attribute__((
        used,
        annotate("as3sig:public function init(i_format:String, i_sample_rate:int, o_format:String, o_sample_rate:int, o_bit_rate:int):void"),
        annotate("as3package:com.marstonstudio.crossusermedia.encoder.wrapper")
    ));

void wrapper_init() {

    char *input_format = NULL;
    AS3_MallocString(input_format, i_format);

    int input_sample_rate;
    AS3_GetScalarFromVar(input_sample_rate, i_sample_rate);

    char *output_format = NULL;
    AS3_MallocString(output_format, o_format);

    int output_sample_rate;
    AS3_GetScalarFromVar(output_sample_rate, o_sample_rate);

    int output_bit_rate;
    AS3_GetScalarFromVar(output_bit_rate, o_bit_rate);

    init(input_format, input_sample_rate, output_format, output_sample_rate, output_bit_rate);

    free(input_format);
    free(output_format);
}

//void init(const char *i_format, int i_sample_rate, const char *o_format, int o_sample_rate, int o_bit_rate)

/*
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
*/