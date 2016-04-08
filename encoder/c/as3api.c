#include <stdio.h>
#include <unistd.h>
#include <string.h>
#include <stdarg.h>
#include "AS3/AS3.h"

int main(int argc, char **argv) {
    fprintf(stdout, "%s\n", "main");
    AS3_GoAsync();
}

// https://www.adobe.com/devnet-docs/flascc/docs/capidocs/as3.html
// https://github.com/crossbridge-community/crossbridge/blob/master/samples/06_SWIG/PassingData/PassData.as

/*
void init() __attribute__((
        used,
        annotate("as3sig:public function init(inputFormatPointer:int, inputSampleRate:int, outputFormatPointer:int, outputSampleRate:int, outputBitRate:int):void"),
        annotate("as3package:com.marstonstudio.crossusermedia.encoder.flascc")
    ));
*/

void as3_init() __attribute__((
        used,
        annotate("as3sig:public function init(inputFormat:String, inputSampleRate:int, outputFormat:String, outputSampleRate:int, outputBitRate:int):void"),
        annotate("as3package:com.marstonstudio.crossusermedia.encoder.flascc")
    ));

void as3_init(const char *i_format, int i_sample_rate, const char *o_format, int o_sample_rate, int o_bit_rate) {

    AS3_MallocString(i_format, inputFormat);
    AS3_GetScalarFromVar(i_sample_rate, inputSampleRate);
    AS3_MallocString(o_format, outputFormat);
    AS3_GetScalarFromVar(o_sample_rate, outputSampleRate);
    AS3_GetScalarFromVar(o_bit_rate, outputBitRate);

    init(i_format, i_sample_rate, o_format, o_sample_rate, o_bit_rate);

    free((char*)i_format);
    free((char*)o_format);
}

void as3_get_output_sample_rate() __attribute__((
        used,
        annotate("as3sig:public function getOutputSampleRate():int"),
        annotate("as3package:com.marstonstudio.crossusermedia.encoder.flascc")
    ));

void as3_get_output_sample_rate() {
    int o_sample_rate = get_output_sample_rate();
    AS3_Return(o_sample_rate);
}

void as3_get_output_format() __attribute__((
        used,
        annotate("as3sig:public function getOutputFormat():String"),
        annotate("as3package:com.marstonstudio.crossusermedia.encoder.flascc")
    ));

void as3_get_output_format() {
    char *o_format = (char*) get_output_format();

    AS3_DeclareVar(outputFormat, String);
    AS3_CopyCStringToVar(outputFormat, o_format, strlen(o_format));
    AS3_ReturnAS3Var(outputFormat);
}

void as3_get_output_length() __attribute__((
        used,
        annotate("as3sig:public function getOutputLength():int"),
        annotate("as3package:com.marstonstudio.crossusermedia.encoder.flascc")
    ));

void as3_get_output_length() {
    int o_length = get_output_length();
    AS3_Return(o_length);
}