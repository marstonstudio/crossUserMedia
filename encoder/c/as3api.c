#include <stdio.h>
#include <unistd.h>
#include <string.h>
#include <stdarg.h>
#include "AS3/AS3.h"

// https://www.adobe.com/devnet-docs/flascc/docs/capidocs/as3.html
// https://github.com/crossbridge-community/crossbridge/blob/master/samples/06_SWIG/PassingData/PassData.as

void as3_init() __attribute__((
        used,
        annotate("as3sig:public function init(inputFormat:String, inputCodec:String, inputSampleRate:int, inputChannels:int, outputFormat:String, outputCodec:String, outputSampleRate:int, outputChannels:int, outputBitRate:int, outputBufferMaxSeconds:int):int"),
        annotate("as3package:com.babelcentral.pcmencoder.flascc")
    ));

void as3_init(const char *i_format_name, const char *i_codec_name, int i_sample_rate,
              int i_channels, const char *o_format_name, const char *o_codec_name,
              int o_sample_rate, int o_channels, int o_bit_rate, int o_buffer_max_seconds)
{
    AS3_MallocString(i_format_name, inputFormat);
    AS3_MallocString(i_codec_name, inputCodec);
    AS3_GetScalarFromVar(i_sample_rate, inputSampleRate);
    AS3_GetScalarFromVar(i_channels, inputChannels);
    AS3_MallocString(o_format_name, outputFormat);
    AS3_MallocString(o_codec_name, outputCodec);
    AS3_GetScalarFromVar(o_sample_rate, outputSampleRate);
    AS3_GetScalarFromVar(o_channels, outputChannels);
    AS3_GetScalarFromVar(o_bit_rate, outputBitRate);
    AS3_GetScalarFromVar(o_buffer_max_seconds, outputBufferMaxSeconds);

    int status = init(i_format_name, i_codec_name, i_sample_rate, i_channels, o_format_name,
         o_codec_name, o_sample_rate, o_channels, o_bit_rate, o_buffer_max_seconds);

    free((char*)i_format_name);
    free((char*)i_codec_name);
    free((char*)o_format_name);
    free((char*)o_codec_name);

    AS3_Return(status);
}

void as3_load_pointer() __attribute__((
        used,
        annotate("as3sig:public function loadPointer(inputPointer:int, inputLength:int):int"),
        annotate("as3package:com.babelcentral.pcmencoder.flascc")
    ));

void as3_load_pointer(uint8_t *i_data, int i_length)
{
    AS3_GetScalarFromVar((uint8_t*)i_data, inputPointer);
    AS3_GetScalarFromVar(i_length, inputLength);

    int status = load(i_data, i_length);

    AS3_Return(status);
}

void as3_get_output_format() __attribute__((
        used,
        annotate("as3sig:public function getOutputFormat():String"),
        annotate("as3package:com.babelcentral.pcmencoder.flascc")
    ));

void as3_get_output_format()
{
    char *o_format = (char*) get_output_format();

    AS3_DeclareVar(outputFormat, String);
    AS3_CopyCStringToVar(outputFormat, o_format, strlen(o_format));
    AS3_ReturnAS3Var(outputFormat);
}


void as3_get_output_codec() __attribute__((
        used,
        annotate("as3sig:public function getOutputCodec():String"),
        annotate("as3package:com.babelcentral.pcmencoder.flascc")
    ));

void as3_get_output_codec()
{
    char *o_codec = (char*) get_output_codec();

    AS3_DeclareVar(outputCodec, String);
    AS3_CopyCStringToVar(outputCodec, o_codec, strlen(o_codec));
    AS3_ReturnAS3Var(outputCodec);
}

void as3_get_output_sample_rate() __attribute__((
        used,
        annotate("as3sig:public function getOutputSampleRate():int"),
        annotate("as3package:com.babelcentral.pcmencoder.flascc")
    ));

void as3_get_output_sample_rate()
{
    int o_sample_rate = get_output_sample_rate();
    AS3_Return(o_sample_rate);
}

void as3_get_output_channels() __attribute__((
        used,
        annotate("as3sig:public function getOutputChannels():int"),
        annotate("as3package:com.babelcentral.pcmencoder.flascc")
    ));

void as3_get_output_channels()
{
    int o_channels = get_output_channels();
    AS3_Return(o_channels);
}

void as3_get_output_pointer() __attribute__((
        used,
        annotate("as3sig:public function getOutputPointer():int"),
        annotate("as3package:com.babelcentral.pcmencoder.flascc")
    ));

void as3_get_output_pointer()
{
    int o_pointer = (int)get_output_pointer();
    AS3_Return(o_pointer);
}

void as3_get_output_length() __attribute__((
        used,
        annotate("as3sig:public function getOutputLength():int"),
        annotate("as3package:com.babelcentral.pcmencoder.flascc")
    ));

void as3_get_output_length()
{
    int o_length = get_output_length();
    AS3_Return(o_length);
}

void as3_get_load_locked_status() __attribute__((
        used,
        annotate("as3sig:public function getLoadLockedStatus():int"),
        annotate("as3package:com.babelcentral.pcmencoder.flascc")
    ));

void as3_get_load_locked_status()
{
    int status = get_load_locked_status();
    AS3_Return(status);
}

void as3_clear() __attribute__((
        used,
        annotate("as3sig:public function clear():void"),
        annotate("as3package:com.babelcentral.pcmencoder.flascc")
    ));

void as3_clear()
{
    clear();
}

void as3_dispose() __attribute__((
        used,
        annotate("as3sig:public function dispose(status:int):void"),
        annotate("as3package:com.babelcentral.pcmencoder.flascc")
    ));

void as3_dispose(int status)
{
    AS3_GetScalarFromVar(status, status);
    dispose(status);
}
