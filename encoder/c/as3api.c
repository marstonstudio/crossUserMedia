#include <stdio.h>
#include <unistd.h>
#include <string.h>
#include <stdarg.h>
#include "AS3/AS3.h"

// https://www.adobe.com/devnet-docs/flascc/docs/capidocs/as3.html
// https://github.com/crossbridge-community/crossbridge/blob/master/samples/06_SWIG/PassingData/PassData.as

void as3_init() __attribute__((
        used,
        annotate("as3sig:public function init(inputFormat:String, inputSampleRate:int, inputChannels:int, outputCodec:String, outputFormat:String, outputSampleRate:int, outputChannels:int, outputBitRate:int):void"),
        annotate("as3package:com.marstonstudio.crossusermedia.encoder.flascc")
    ));

void as3_init(const char *i_format, int i_sample_rate, int i_channels, const char *o_codec, const char *o_format, int o_sample_rate, int o_channels, int o_bit_rate) {

    AS3_MallocString(i_format, inputFormat);
    AS3_GetScalarFromVar(i_sample_rate, inputSampleRate);
    AS3_GetScalarFromVar(i_channels, inputChannels);
    AS3_MallocString(o_codec, outputCodec);
    AS3_MallocString(o_format, outputFormat);
    AS3_GetScalarFromVar(o_sample_rate, outputSampleRate);
    AS3_GetScalarFromVar(o_channels, outputChannels);
    AS3_GetScalarFromVar(o_bit_rate, outputBitRate);

    init(i_format, i_sample_rate, i_channels, o_codec, o_format, o_sample_rate, o_channels, o_bit_rate);

    free((char*)i_format);
    free((char*)o_codec);
    free((char*)o_format);
}

void as3_load_pointer() __attribute__((
        used,
        annotate("as3sig:public function loadPointer(inputPointer:int, inputLength:int):void"),
        annotate("as3package:com.marstonstudio.crossusermedia.encoder.flascc")
    ));

void as3_load_pointer(uint8_t *i_data, int i_length) {

    AS3_GetScalarFromVar((uint8_t *)i_data, inputPointer);
    AS3_GetScalarFromVar(i_length, inputLength);

    load(i_data, i_length);
}

void as3_flush_pointer() __attribute__((
        used,
        annotate("as3sig:public function flushPointer():int"),
        annotate("as3package:com.marstonstudio.crossusermedia.encoder.flascc")
    ));

void as3_flush_pointer() {
    int o_data = (int)flush();
    AS3_Return(o_data);
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

void as3_dispose() __attribute__((
        used,
        annotate("as3sig:public function dispose(status:int):void"),
        annotate("as3package:com.marstonstudio.crossusermedia.encoder.flascc")
    ));

void as3_dispose(int status) {
    AS3_GetScalarFromVar(status, status);
    dispose(status);
}