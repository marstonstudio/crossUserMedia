/**
  * User: Jon, Peter, Damian
  * Date: 4/18/16
  * Time: 8:48 AM
  * Copyright English Central Inc. 2016
  */

/*
FFMpeg Primer

    Files are Containers
    Containers are described with a Format Context
    Containers are read/written to files with IO
    Custom IO is used to read/write from memory
    Containers have one or more Streams
    Muxers separate/combine multiple Streams in a Container
    Streams are a sequence of Packets
    Packets contain one or more Frames of some Format
    Fifos buffer data so it can be read in Frame size chunks
    Codecs input Frames of one Format, and output Packets of different Format
    Codecs may not produce immediate output
    Resamplers convert on sample rate to another, created with a Resampler Context

Notes
    In general a Foo is created with a FooContext

    Memory should be allocated/freed with av_malloc and av_free
    Free buffers first, then free the Context

This API

    Input is read from memory buffers
    A Fifo is used to compact buffers into Frames

    All entry points return an integer error code
    0 = no error, otherwise get_error_text returns a user friendly message

    In this application the input is buffers of PCM Doubles
    The output is a buffer containing an MP4 file with an AAC stream

    To read from/write to the containers in memory instead of a file
    there is are custom IO's for the respective format contexts

    http://www.codeproject.com/Tips/489450/Creating-Custom-FFmpeg-IO-Context
    http://miphol.com/muse/2014/03/custom-io-with-ffmpeg.html
*/

#include <stdio.h>
#include <fcntl.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>
#include <stdarg.h>
#include <stdbool.h>
#include <unistd.h>

#include "libavformat/avformat.h"
#include "libavformat/avio.h"
#include "libavcodec/avcodec.h"
#include "libavutil/audio_fifo.h"
#include "libavutil/avassert.h"
#include "libavutil/avstring.h"
#include "libavutil/frame.h"
#include "libavutil/log.h"
#include "libavutil/opt.h"
#include "libswresample/swresample.h"

#ifdef __FLASHPLAYER__
#include "AS3/AS3.h"
#endif

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

void dispose(int status);

//Initialize the global input and output contexts
AVCodecContext *input_codec_context;
AVFormatContext *input_format_context;

AVCodecContext *output_codec_context;
AVFormatContext *output_format_context;

SwrContext *resample_context;
AVAudioFifo *fifo;

bool passthru_encoding;
bool load_locked;
bool flushed;
int64_t audio_frame_pts;

struct buffer_data {
    uint8_t *ptr;
    size_t size;
    int offset;
};

#define ERROR_CODE int
#define NO_ERROR 0
#define INTERNAL_ERROR -1

//Verbosity levels
// Traces, Errors, Warnings, Infos, and Logs: 4
// Errors, Warnings, Infos, and Logs: 4
// Errors, Warnings, and Infos: 3
// Errors and Warnings: 2
// Errors: 1
// Nothing: 0
#define VERBOSITY 3

#if VERBOSITY >= 5
#define TRACE(M, ...) fprintf(stdout, "TRACE :: %d %s :: " M "\n",__LINE__, __FUNCTION__, ##__VA_ARGS__)
#else
#define TRACE(M, ...) /* nothing */
#endif

#if VERBOSITY >= 4
#define LOG(M, ...) fprintf(stdout, "LOG :: %d %s :: " M "\n", __LINE__, __FUNCTION__, ##__VA_ARGS__)
#else
#define LOG(M, ...) /* nothing */
#endif

#if VERBOSITY >= 3
#define INFO(M, ...) fprintf(stdout, "INFO :: %d %s :: " M "\n", __LINE__, __FUNCTION__, ##__VA_ARGS__)
#else
#define INFO(M, ...) /* nothing */
#endif

#if VERBOSITY >= 2
#define WARNING(M, ...) fprintf(stdout, "WARNING :: %d %s :: " M "\n", __LINE__, __FUNCTION__, ##__VA_ARGS__)
#else
#define WARNING(M, ...) /* nothing */
#endif

#if VERBOSITY >= 1
#define ERROR(M, ...) fprintf(stderr, "ERROR :: %d %s :: " M "\n", __LINE__, __FUNCTION__, ##__VA_ARGS__)
#else
#define ERROR(M, ...) /* nothing */
#endif

//Important Note:
//In order to use these error checking macros, the following fields must be defined in
// the containing function to ensure proper operation:
//
// ERROR_CODE _error = NO_ERROR; //To be defined at the very top of the function
//
// cleanup: //A goto tag to be placed at the very end of the function where the various cleanup routines are contained
//  //Cleanup routines here
//
// Note: All variables cleaned in the cleanup section must be defined at the top of the respective function
//  before any CHK macros and set to some default, uninitialized value (such as NULL)
//
#define CHK_VOID(x)                             \
    {                                           \
        TRACE(#x);                              \
        x;                                      \
    }
#define CHK_NULL(x)                                             \
    do {                                                        \
        TRACE(#x);                                                \
        if(!(x))                                                \
        {                                                       \
            ERROR("%s FAILED", #x);                             \
            _error = INTERNAL_ERROR; /*There was an error!*/    \
            goto cleanup;                                       \
        }                                                       \
    } while(0)

#define CHK_ERROR(x)                                                    \
    do {                                                                \
        TRACE(#x);                                                        \
        int _tmp = (x);                                                 \
        if(_tmp < 0)                                                    \
        {                                                               \
            ERROR("%s FAILED code=%d %s", #x, _tmp, get_error_text(_tmp)); \
            _error = INTERNAL_ERROR; /*There was an error!*/            \
            goto cleanup;                                               \
        }                                                               \
    } while(0)

#define CHK_GE(x, y)                                                    \
    do {                                                                \
        TRACE(#x);                                                        \
        int _tmp = (x);                                                 \
        if(_tmp < y)                                                    \
        {                                                               \
            ERROR("%s FAILED %d < %d", #x, _tmp, y);                    \
            _error = INTERNAL_ERROR; /*There was an error!*/            \
            goto cleanup;                                               \
        }                                                               \
    } while(0)

#define CHK_LE(x, y)                                                    \
    do {                                                                \
        TRACE(#x);                                                        \
        int _tmp = (x);                                                 \
        if(_tmp > y)                                                    \
        {                                                               \
            ERROR("%s FAILED %d > %d", #x, _tmp, y);                    \
            _error = INTERNAL_ERROR; /*There was an error!*/            \
            goto cleanup;                                               \
        }                                                               \
    } while(0)

#define CHK_EQ(x, y)                                                    \
    do {                                                                \
        TRACE(#x);                                                        \
        int _tmp = (x);                                                 \
        if(_tmp != y)                                                   \
        {                                                               \
            ERROR("%s FAILED %d != %d", #x, _tmp, y);                   \
            _error = INTERNAL_ERROR; /*There was an error!*/            \
            goto cleanup;                                               \
        }                                                               \
    } while(0)

#define CHK_NEQ(x, y)                                                    \
    do {                                                                \
        TRACE(#x);                                                        \
        int _tmp = (x);                                                 \
        if(_tmp == y)                                                   \
        {                                                               \
            ERROR("%s FAILED %d == %d", #x, _tmp, y);                   \
            _error = INTERNAL_ERROR; /*There was an error!*/            \
            goto cleanup;                                               \
        }                                                               \
    } while(0)

static void av_log_encoder(void *avcl, int level, const char *fmt, va_list vl)
{
    //TODO: risks here? does this need to be freed or protected against overflow?
    char message[255];
    int ret = vsprintf(message, fmt, vl);

    const char *item_name = av_default_item_name(avcl);

    if(level <= AV_LOG_PANIC && VERBOSITY >= 1)
    {
        fprintf(stderr, "FFMPEG ERROR :: %s :: %s", item_name, message);
    }
    else if(level <= AV_LOG_WARNING && VERBOSITY >= 2)
    {
        fprintf(stdout, "FFMPEG WARN :: %s :: %s", item_name, message);
    }
    else if(level <= AV_LOG_INFO && VERBOSITY >= 3)
    {
        fprintf(stdout, "FFMPEG INFO :: %s :: %s", item_name, message);
    }
    else if(level <= AV_LOG_DEBUG && VERBOSITY >= 4)
    {
        fprintf(stdout, "FFMPEG LOG  :: %s :: %s", item_name, message);
    }
    else if(level <= AV_LOG_TRACE && VERBOSITY >= 5)
    {
        fprintf(stdout, "FFMPEG TRACE  :: %s :: %s", item_name, message);
    }
}

//Convert an error code into its corresponding error text message (not thread-safe).
static const char *get_error_text(const ERROR_CODE error)
{
    //TODO: The `static char*` type can cause issues sometimes due to
    // optimizations in the flash and js cross-compilers
    static char error_buffer[255];
    av_strerror(error, error_buffer, sizeof(error_buffer));
    return error_buffer;
}

int input_read(void *ptr, uint8_t *buf, int buf_size)
{
    struct buffer_data *bd = (struct buffer_data*)ptr;

    //Sanity check
    if(!bd)
    {
        LOG("NULL ptr buffer encountered");
        return 0;
    }

    const int data_left = bd->size - bd->offset;
    TRACE("bd->ptr: %p bd->offset: %d data_left: %d buf_size: %d", bd->ptr, bd->offset, data_left, buf_size);

    //Overflow protection
    // TODO:is this an actual problem if this occurs?
    if(buf_size > data_left)
    {
        buf_size = data_left;
        TRACE("Read overflow encountered");
    }

    //Copy internal buffer data to `buf`
    memcpy(buf, bd->ptr + bd->offset, buf_size);
    bd->offset += buf_size;

    return buf_size;
}

int output_write(void *ptr, uint8_t *buf, int buf_size)
{
    struct buffer_data *bd = (struct buffer_data*)ptr;

    //Sanity check
    if(!bd)
    {
        WARNING("NULL ptr buffer encountered");
        return 0;
    }

    const int space_left = bd->size - bd->offset;
    TRACE("bd->ptr: %p bd->size: %zd bd->offset: %d space_left: %d buf_size: %d",
        bd->ptr, bd->size, bd->offset, space_left, buf_size);

    //Overflow protection
    if(buf_size > space_left)
    {
        buf_size = space_left;
        WARNING("Write overflow encountered");
    }

    memcpy(bd->ptr + bd->offset, buf, buf_size);
    bd->offset += buf_size;
    TRACE("bd->offset: %d", bd->offset);

    return buf_size;
}

int64_t output_seek(void *ptr, int64_t offset, int whence)
{
    struct buffer_data *bd = (struct buffer_data*)ptr;

    //Sanity check
    if(!bd)
    {
        WARNING("NULL ptr buffer encountered");
        return 0;
    }


    TRACE("bd->ptr: %p bd->size: %zd bd->offset %d offset: %lld whence: %d",
        bd->ptr, bd->size, bd->offset, offset, whence);

    //Overflow protection
    if(offset >= bd->size)
    {
        WARNING("Seek overflow encountered");
        return 0;
    }

    bd->offset = offset;
    TRACE("bd->offset: %d", bd->offset);

    return offset;
}

AVCodecContext *init_codec_context(AVCodec *codec, int sample_rate, int channels, int bit_rate)
{
    ERROR_CODE _error = NO_ERROR;

    //Instantiate the variables of this function before any CHK macros
    AVCodecContext *codec_context = NULL;

    //Create a new codec context.
    CHK_NULL(codec_context = avcodec_alloc_context3(codec));

    //PCM decoders have no set sample rates, so no need to check it

    //Set the parameters for the codec
    codec_context->sample_fmt = codec->sample_fmts[0];
    codec_context->sample_rate = sample_rate;
    codec_context->channels = channels;
    codec_context->channel_layout = av_get_default_channel_layout(channels);

    if(bit_rate > 0)
        codec_context->bit_rate = bit_rate;

    //Open up the codec
    CHK_ERROR(avcodec_open2(codec_context, codec, NULL));

cleanup:
    //If there were an error, clean up accordingly
    if(_error != NO_ERROR)
    {
        if(codec_context)
            avcodec_free_context(&codec_context);

        //Return NULL on error
        return NULL;
    }

    return codec_context;
}

//Initialize one data packet for reading or writing.
void init_packet(AVPacket *packet)
{
    av_init_packet(packet);
    //Set the packet data and size so that it is recognized as being empty.
    packet->data = NULL;
    packet->size = 0;
}

//Initialize the audio resampler based on the input and output codec settings.
// If the input and output sample formats differ, a conversion is required
// libswresample takes care of this, but requires initialization.
SwrContext *init_resampler(AVCodecContext *i_codec_context, AVCodecContext *o_codec_context)
{
    ERROR_CODE _error = NO_ERROR;

    //Instantiate the variables of this function before any CHK macros
    SwrContext *r_context = NULL;

    // @see ../ffmeg/libswresample/swresample.h
    // @see ffmpeg/docs/examples/resampling_audio.c

    //Perform a sanity check so that the number of converted samples is
    // not greater than the number of samples to be converted.
    // If the sample rates differ, this case has to be handled differently
    CHK_EQ(o_codec_context->sample_rate <= i_codec_context->sample_rate, true);

    //Create a resampler context for the conversion.
    // Set the conversion parameters.
    // Default channel layouts based on the number of channels
    // are assumed for simplicity (they are sometimes not detected
    // properly by the demuxer and/or decoder).
    CHK_NULL(r_context = swr_alloc_set_opts(
                                            NULL, // allocate a new SwrContext
                                            av_get_default_channel_layout(o_codec_context->channels), // output channel layout
                                            o_codec_context->sample_fmt, // output sample format
                                            o_codec_context->sample_rate,// output sample rate
                                            av_get_default_channel_layout(i_codec_context->channels), // input channel layout
                                            i_codec_context->sample_fmt, // input sample format
                                            i_codec_context->sample_rate,// input sample rate
                                            0,   // log offset
                                            NULL // log context
                                            ));

    //Open the resampler with the specified parameters.
    CHK_ERROR(swr_init(r_context));

cleanup:
    //If there were an error, clean up accordingly
    if(_error != NO_ERROR)
    {
        if(r_context)
            swr_free(&r_context);

        //Return NULL on error
        return NULL;
    }

    return r_context;
}

AVIOContext *init_io(void *internal_data, int write_flag,
                     int(*read_packet)(void*, uint8_t*, int),
                     int(*write_packet)(void*, uint8_t*, int),
                     int64_t(*seek)(void*, int64_t, int))
{
    ERROR_CODE _error = NO_ERROR;

    //Instantiate the variables of this function before any CHK macros
    uint8_t *ioBuffer = NULL;
    AVIOContext *avioContext = NULL;

    //Allocate space for the custom io's internal buffer
    const int ioBufferSize = 4096;
    CHK_NULL(ioBuffer = (uint8_t*)av_malloc(ioBufferSize));

    //Initialize the custom io
    CHK_NULL(avioContext = avio_alloc_context(ioBuffer, ioBufferSize, write_flag, internal_data,
                                              read_packet, write_packet, seek));

cleanup:
    //If there were an error, clean up accordingly
    if(_error != NO_ERROR)
    {
        if(ioBuffer)
            av_free(ioBuffer);

        //There is no need to handle `avioContext` because if it passed, as it is the last
        // operation in this function, then this error cleanup routine would never be executed

        //Return NULL on error
        return NULL;
    }

    return avioContext;
}

AVFormatContext *init_input_format_context(const char *i_format_name)
{
    ERROR_CODE _error = NO_ERROR;

    //Instantiate the variables of this function before any CHK macros
    AVIOContext *input_io_context = NULL;
    AVFormatContext *i_context = NULL;
    AVInputFormat *i_format = NULL;

    //Initialize the input's custom io without any data as it still has not come in yet
    CHK_NULL(input_io_context = init_io(NULL, 0, &input_read, NULL, NULL));

    //Allocate some space for the input format context and connect the custom io to it
    CHK_NULL(i_context = avformat_alloc_context());
    i_context->pb = input_io_context;

    //Since the input audio data is header-less, manually set its input format to a global variable
    CHK_NULL(i_format = av_find_input_format(i_format_name));

    //Initialize the input format context without an input file, but with a custom io and a manually set input format
    CHK_ERROR(avformat_open_input(&i_context, NULL, i_format, NULL));
    CHK_ERROR(avformat_find_stream_info(i_context, NULL));

cleanup:
    //If there were an error, clean up accordingly
    if(_error != NO_ERROR)
    {
        //If the `input_io_context` was initialized correctly (ie: bears a non-NULL value), then
        // its internal buffer must have initialized properly as well
        if(input_io_context)
        {
            av_free(input_io_context->buffer);
            av_free(input_io_context);
        }

        if(i_context)
            avformat_free_context(i_context);

        //Return NULL on error
        return NULL;
    }

    return i_context;
}

AVFormatContext *init_output_format_context(const char *o_format, int o_buffer_max_seconds)
{
    ERROR_CODE _error = NO_ERROR;

    //Instantiate the variables of this function before any CHK macros
    uint8_t *output_data = NULL;
    struct buffer_data *output_bd = NULL;
    AVIOContext *output_io_context = NULL;
    AVFormatContext *o_context = NULL;
    AVStream *output_stream = NULL;

    //Only allow a maximum of 60 seconds of output audio
    CHK_LE(o_buffer_max_seconds, 60);

    //Allocate space to contain `o_buffer_max_seconds` of output data
    //
    // This is done by taking the output's samples per second times the number of
    // max seconds to store times 4 bytes per sample (32bit)
    const int max_output_length = output_codec_context->sample_rate * o_buffer_max_seconds * 4;
    CHK_NULL(output_data = (uint8_t*)av_malloc(max_output_length));

    //Initialize the internal input buffer data for its custom io
    CHK_NULL(output_bd = (struct buffer_data*)av_malloc(sizeof(struct buffer_data)));
    *output_bd = (struct buffer_data){.ptr = output_data, .size = (size_t)max_output_length, .offset = 0};
    LOG("output_bd: ptr: %p, size: %zd, offset %d", output_bd->ptr, output_bd->size, output_bd->offset);

    //Initialize the output's custom io
    CHK_NULL(output_io_context = init_io(output_bd, 1, NULL, &output_write, &output_seek));

    //Create a new format context for the output container format.
    CHK_NULL(o_context = avformat_alloc_context());
    // --
    //Associate the output file (pointer) with the container format context.
    o_context->pb = output_io_context;

    //Set the container format to output_format
    CHK_NULL(o_context->oformat = av_guess_format(o_format, NULL, NULL));

    //Some container formats (like MP4) require global headers to be present
    // Mark the encoder so that it behaves accordingly.
    if(o_context->oformat->flags & AVFMT_GLOBALHEADER)
        output_codec_context->flags |= AV_CODEC_FLAG_GLOBAL_HEADER;

    //Create a new audio stream in the output file container.
    CHK_NULL(output_stream = avformat_new_stream(o_context, output_codec_context->codec));

    //Set the sample rate for the container.
    output_stream->time_base.den = input_codec_context->sample_rate;
    output_stream->time_base.num = 1;

    CHK_ERROR(avcodec_parameters_from_context(output_stream->codecpar, output_codec_context));

    //Write the Header to the output container
    CHK_ERROR(avformat_write_header(o_context, NULL));

cleanup:
    //If there were an error, clean up accordingly
    if(_error != NO_ERROR)
    {
        if(output_data) {
            av_free(output_data);
            output_data = NULL;
        }
        if(output_bd) {
            av_free(output_bd);
            output_bd = NULL;
        }

        //If the `output_io_context` was initialized correctly (ie: bears a non-NULL value), then
        // its internal buffer must have initialized properly as well
        if(output_io_context)
        {
            av_free(output_io_context->buffer);
            av_free(output_io_context);
            output_io_context = NULL;
        }

        if(o_context) {
            avformat_free_context(o_context);
            o_context = NULL;
        }

        //The `output_stream` gets free'd by clearing the output's codec and format contexts. Eventually, by
        // the end of this error handling pipeline, both of those will be clears, indirectly also
        // clearing the `output_stream`

        //Return NULL on error
        return NULL;
    }

    return o_context;
}

//Check that a given sample format is supported by the encoder
int check_sample_rate(AVCodec *codec, int sample_rate)
{
    LOG("sample_rate: %d", sample_rate);
    const int *p = codec->supported_samplerates;
    while (*p != 0) {
        LOG("available: %d", *p);

        if (*p == sample_rate)
            return 1;
        p++;
    }
    return 0;
}

//Initialize all of the critical data structures needed for this encoder
int init(const char *i_format_name, const char *i_codec_name, int i_sample_rate,
          int i_channels, const char *o_format_name, const char *o_codec_name,
          int o_sample_rate, int o_channels, int o_bit_rate, int o_buffer_max_seconds)
{
    ERROR_CODE _error = NO_ERROR;

    //Initialize the global variables to their default values
    input_codec_context = NULL;
    input_format_context = NULL;

    output_codec_context = NULL;
    output_format_context = NULL;

    resample_context = NULL;
    fifo = NULL;

    passthru_encoding = false;
    load_locked = false;
    flushed = false;
    audio_frame_pts = 0;

    //Instantiate the variables of this function before any CHK macros
    AVCodec *i_codec = NULL, *o_codec = NULL;

    INFO("(%s, %s, %d, %d, %s, %s, %d, %d, %d, %d)",
        i_format_name, i_codec_name, i_sample_rate, i_channels,
        o_format_name, o_codec_name, o_sample_rate, o_channels,
        o_bit_rate, o_buffer_max_seconds);

    //Log as documentation that 32kbits output bit rate may yield
    // unpredictable output in this encoder for whatever reason
    // when compiled for GCC in Cygwin
    if(o_bit_rate == 32000)
        TRACE("Output bit rate is %d which may yield unpredictable output in this encoder", o_bit_rate);

    //Enable the `passthru_encoding` if both the input and output codec names are the same
    passthru_encoding = !strcmp(i_codec_name, o_codec_name);

    LOG("passthru_encoding: %s", passthru_encoding ? "true" : "false");

    //Register all codecs and formats so that they can be used.
    av_register_all();

    //
    //Initialize input contexts
    //

    //Create an input codec context given the input header information
    TRACE("i_codec_name=%s",i_codec_name);

    CHK_NULL(i_codec = avcodec_find_decoder_by_name(i_codec_name));
    CHK_NULL(input_codec_context = init_codec_context(i_codec, i_sample_rate, i_channels, -1));

    CHK_NULL(input_format_context = init_input_format_context(i_format_name));

    //
    //Initialize output contexts
    //

    //Create an output codec context given the output header information
    CHK_NULL(o_codec = avcodec_find_encoder_by_name(o_codec_name));
    CHK_NULL(output_codec_context = init_codec_context(o_codec, o_sample_rate, o_channels, o_bit_rate));

    //ADDED sketchy patch to get the passthru working using the resampler, fifo, decoding, and encoding
    if(passthru_encoding)
        output_codec_context->frame_size = 1024;

    //Allow the use of the experimental AAC encoder
    output_codec_context->strict_std_compliance = FF_COMPLIANCE_EXPERIMENTAL;

    //Initialize the output format context
    CHK_NULL(output_format_context = init_output_format_context(o_format_name, o_buffer_max_seconds));

    //
    //Resampler
    //
    CHK_NULL(resample_context = init_resampler(input_codec_context, output_codec_context));

    //
    //FIFO
    //
    //Create the input FIFO buffer based on the Codec input format
    CHK_NULL(fifo = av_audio_fifo_alloc(output_codec_context->sample_fmt, output_codec_context->channels, 1));

cleanup:
    //If there were an error, clean up accordingly and exit with an error status
    if(_error != NO_ERROR)
        dispose(1); //Calls `exit(1)` internally

    return 0;
}

//Add converted input audio samples to the FIFO buffer for later processing.
ERROR_CODE add_samples_to_fifo(AVAudioFifo *audio_fifo, uint8_t **converted_input_samples, const int frame_size)
{
    ERROR_CODE _error = NO_ERROR;

    //Make the FIFO as large as it needs to be to hold both the old and the new samples.
    CHK_ERROR(av_audio_fifo_realloc(audio_fifo, av_audio_fifo_size(fifo) + frame_size));

    //Store the new samples in the FIFO buffer.
    CHK_GE(av_audio_fifo_write(audio_fifo, (void**)converted_input_samples, frame_size), frame_size);

cleanup:
    return _error;
}

//Convert the input audio samples into the output sample format. The conversion happens
// on a per-frame basis, the size of which is specified by frame_size.
ERROR_CODE convert_samples(const uint8_t **input_samples, uint8_t **output_samples,
                           const int input_sample_count, int *output_sample_count,
                           const int input_sample_rate, const int output_sample_rate,
                           const int sample_format,
                           SwrContext *swr)
{
    ERROR_CODE _error = NO_ERROR;

    TRACE("input_sample_count %d", input_sample_count);
    TRACE("input_sample_rate %d", input_sample_rate);
    TRACE("output_sample_rate %d", output_sample_rate);
    TRACE("sample_format %d", sample_format);

    int sample_count = 0;
    CHK_ERROR(sample_count = av_rescale_rnd(swr_get_delay(swr, input_sample_rate) + input_sample_count,
                                               output_sample_rate, input_sample_rate, AV_ROUND_UP));

    TRACE("sample_count %d", sample_count);

    CHK_ERROR(av_samples_alloc(output_samples, NULL, 2, sample_count, sample_format, 0));

    CHK_ERROR(*output_sample_count = swr_convert(swr, output_samples, sample_count, input_samples, input_sample_count));

    TRACE("*output_sample_count %d", *output_sample_count);

cleanup:
    return _error;
}

//Initialize a temporary storage for the specified number of audio samples.
// The conversion requires temporary storage due to the different format.
// The number of audio samples to be allocated is specified in frame_size.
//
// The cleaning of `*converted_input_samples` is to be handled by the calling function
ERROR_CODE init_converted_samples(uint8_t ***converted_input_samples, AVCodecContext *o_codec_context, int frame_size)
{
    ERROR_CODE _error = NO_ERROR;

    //Allocate as many pointers as there are audio channels.
    // Each pointer will later point to the audio samples of the corresponding
    // channels (although it may be NULL for interleaved formats).
    CHK_NULL(*converted_input_samples = calloc(o_codec_context->channels, sizeof(**converted_input_samples)));

    //Allocate memory for the samples of all channels in one consecutive block for convenience.
    CHK_ERROR(av_samples_alloc(*converted_input_samples, NULL, o_codec_context->channels,
                               frame_size, o_codec_context->sample_fmt, 0));

cleanup:
    //Cleaning `*converted_input_samples` is handled one level up in the calling function
    return _error;
}

//Decode one audio frame from the input file.
ERROR_CODE decode_audio_frame(AVFrame *frame, AVFormatContext *i_format_context,
                              AVCodecContext *i_codec_context, int *data_present,
                              int *finished)
{
    ERROR_CODE _error = NO_ERROR;

    //Packet used for temporary storage
    AVPacket input_packet;
    init_packet(&input_packet);

    //Read one audio frame from the input file into a temporary packet until
    // the end of the input is reached. Once the input is exhausted, `input_packet`
    // will still be empty which will flush the decoder below
    int eof = 0;
    int packet_available = 0;
    TRACE("av_read_frame(i_format_context, &input_packet)");
    _error = av_read_frame(i_format_context, &input_packet);
    LOG("_error = %d (%s)",_error,get_error_text(_error));
    if( _error < 0 ) {
        //If this is an end of file error, it will not be treated as an error, only a signal
        if(_error == AVERROR_EOF) {
          eof = 1;
          _error = NO_ERROR; //Clear the EOF error
        } else {
          ERROR("Could not read frame ('%s')", get_error_text(_error));
          goto cleanup;
        }
    } else {
      packet_available = input_packet.size > 0;
    }
    LOG("eof = %d",eof);
    LOG("packet_available = %d",packet_available);
    LOG("input_packet = size=%d, flags=%d, data=%p", input_packet.size, input_packet.flags, input_packet.data);

    //Decode the audio frame stored in the temporary packet. An empty `input_packet` will flush the decoder.
    int frame_available = 0;
    if(packet_available) {
      TRACE("avcodec_send_packet(i_codec_context, &input_packet)");
      _error = avcodec_send_packet(i_codec_context, &input_packet);
      LOG("_error = %d (%s)",_error,get_error_text(_error));
      if( _error == 0 ) {
        frame_available = 1;
      } else if( _error == AVERROR_EOF ) {
        _error = NO_ERROR; //Clear the EOF error
      } else {
        ERROR("Could not send packet ('%s')", get_error_text(_error));
        goto cleanup;
      }
    } else {
      _error = 0;
      // TODO: Is there left over data waiting int the codec?
    }
    LOG("frame_available = %d",frame_available);

    if( frame_available ) {
      TRACE("avcodec_receive_frame(i_codec_context, frame)");
      _error = avcodec_receive_frame(i_codec_context, frame);
      LOG("_error = %d (%s)",_error,get_error_text(_error));
      if( _error == 0 ) {
        *data_present = 1;
      } else if( _error == AVERROR_EOF ) {
        *data_present = 0;
        _error = NO_ERROR; //Clear the EOF error
      } else {
        *data_present = 0;
        ERROR("Could not receive frame ('%s')", get_error_text(_error));
        goto cleanup;
      }
    }

    *finished = eof && !(packet_available || frame_available);

    LOG("*frame nb_samples=%d format=%d",frame->nb_samples,frame->format);
    LOG("*data_present = %d",*data_present);
    LOG("*finished = %d",*finished);

cleanup:
    av_packet_unref(&input_packet);
    return _error;
}

//Read one audio frame from the input file, decodes, converts and stores it in the FIFO buffer.
ERROR_CODE read_decode_convert_and_store(AVAudioFifo *audio_fifo, AVFormatContext *i_format_context,
                                         AVCodecContext *i_codec_context, AVCodecContext *o_codec_context,
                                         SwrContext *r_context, int *finished)
{
    ERROR_CODE _error = NO_ERROR;

    //Temporary storage of the input samples of the frame read from the file.
    AVFrame *input_frame = NULL;
    int data_present = 0;

    //Initialize temporary storage for one input frame.
    CHK_NULL(input_frame = av_frame_alloc());

    //Decode one frame worth of audio samples.
    CHK_ERROR(decode_audio_frame(input_frame, i_format_context, i_codec_context, &data_present, finished));

    //If end of the input is not reached, or there are samples in the decoder which are delayed
      //If there is decoded data, convert and store it
    if(data_present) {

      uint8_t **output_samples = NULL; //Temporary storage for the converted input samples.
      int output_sample_count = 0;

      //Initialize the temporary storage for the converted input samples.
      CHK_ERROR(init_converted_samples(&output_samples, o_codec_context, input_frame->nb_samples));

      //Convert the input samples to the desired output sample format. This requires a
      // temporary storage provided by converted_input_samples.

      CHK_ERROR(convert_samples((const uint8_t**)input_frame->extended_data, output_samples,
                                input_frame->nb_samples, &output_sample_count,
                                i_codec_context->sample_rate, o_codec_context->sample_rate,
                                i_codec_context->sample_fmt,
                                r_context));

      LOG("av_audio_fifo_size(audio_fifo) %d", av_audio_fifo_size(audio_fifo));

      //Add the converted input samples to the FIFO buffer for latter processing.
      CHK_ERROR(add_samples_to_fifo(audio_fifo, output_samples, output_sample_count));

      LOG("av_audio_fifo_size(audio_fifo) %d", av_audio_fifo_size(audio_fifo));

      CHK_VOID(av_freep(&output_samples[0]));
      CHK_VOID(free(output_samples));
    }
    // TODO: is there still data waiting in the Resampler?

cleanup:
    if(input_frame)
        av_frame_free(&input_frame);

    return _error;
}

//Initialize one input frame for writing to the output file. The frame will be exactly `frame_size` samples large.
//
// The cleaning of `*frame` is to be handled by the calling function
ERROR_CODE init_output_frame(AVFrame **frame, AVCodecContext *o_codec_context, int frame_size)
{
    ERROR_CODE _error = NO_ERROR;

    //Create a new frame to store the audio samples.
    CHK_NULL(*frame = av_frame_alloc());

    //Set the frame's parameters, especially its size and format. The `av_frame_get_buffer` needs this
    // to allocate memory for the audio samples of the frame. Default channel layouts based on
    // the number of channels are assumed for simplicity.
    (*frame)->nb_samples = frame_size;
    (*frame)->channel_layout = output_codec_context->channel_layout;
    (*frame)->format = output_codec_context->sample_fmt;
    (*frame)->sample_rate = output_codec_context->sample_rate;

    //Allocate the samples of the created frame. This call will make sure
    // that the audio frame can hold as many samples as specified.
    CHK_ERROR(av_frame_get_buffer(*frame, 0));

cleanup:
    return _error;
}

//Encode one frame worth of audio to the output file.
ERROR_CODE encode_audio_frame(AVFrame *frame, AVFormatContext *o_format_context,
                              AVCodecContext *o_codec_context, int *data_present)
{
    ERROR_CODE _error = NO_ERROR;

    //Packet used for temporary storage.
    AVPacket output_packet;
    int error;
    init_packet(&output_packet);

    //Set a timestamp based on the sample rate for the container.
    if(frame)
    {
        frame->pts = audio_frame_pts;
        audio_frame_pts += frame->nb_samples;
    }

    //Encode the audio frame and store it in the temporary packet.
    CHK_ERROR(avcodec_send_frame(o_codec_context, frame));
    _error = avcodec_receive_packet(o_codec_context, &output_packet);

    if( _error == 0 ) {
      //Write one audio frame from the temporary packet to the output file.
      CHK_ERROR(av_write_frame(o_format_context, &output_packet));
    }
    // TODO:
    // sometimes avcodec_receive_packet returns "code=-11 Resource temporarily unavailable"
    // is this a problem

    //else if( _error == AVERROR_EOF ) {
    //  *finished = 1;
    //  _error = NO_ERROR; //Clear the EOF error
    //} else {
    //  ERROR("Could not decode frame ('%s')", get_error_text(_error));
    //  goto cleanup;
    //}


cleanup:
    av_packet_unref(&output_packet);
    return 0;
}

//Load one audio frame from the FIFO buffer, encode and write it to the output file.
ERROR_CODE load_encode_and_write(AVAudioFifo *audio_fifo, AVFormatContext *o_format_context,
                                 AVCodecContext *o_codec_context)
{
    ERROR_CODE _error = NO_ERROR;

    //Temporary storage of the output samples of the frame written to the file.
    AVFrame *output_frame = NULL;

    //Use the maximum number of possible samples per frame. If there is
    // less than that in the FIFO, simply exhaust whatever is left.
    const int frame_size = FFMIN(av_audio_fifo_size(fifo), output_codec_context->frame_size);
    int data_written = 0;

    //Initialize temporary storage for one output frame.
    CHK_ERROR(init_output_frame(&output_frame, output_codec_context, frame_size));

    //Read as many samples from the FIFO buffer as required to fill the frame.
    // The samples are stored in the frame temporarily.
    CHK_GE(av_audio_fifo_read(fifo, (void**)output_frame->data, frame_size), frame_size);

    //Encode one frame worth of audio samples.
    CHK_ERROR(encode_audio_frame(output_frame, output_format_context, output_codec_context, &data_written));

cleanup:
    if(output_frame)
        av_frame_free(&output_frame);
    return _error;
}


// load data into the encoder
//
// call with i_length=0 to flush the encoder of any remaining samples
//
// returns back value of i_length as confirmation of what has been encoded
//
// This function is meant to be synchronous.
// If called again before the previous call has finished, then will will block
// and return value of -1 to indicate that the call did nothing
int load(uint8_t *i_data, int i_length)
{
    ERROR_CODE _error = NO_ERROR;
    TRACE("load(i_data=%p, i_length=%d)", i_data, i_length);

    if(flushed)
    {
        WARNING("called after flushing, no new data accepted. call init() to restart");
        return 0;
    }

    if(load_locked)
    {
        WARNING("load_locked, no data processed, returning value of 1");
        return 1;
    }
    load_locked = true;

    // we are done, so execute a flush of all data waiting to be encoded
    if(i_length == 0)
    {
      TRACE("i_length == 0 flushing...");
      //Encode any remaining samples in the fifo after all of the loads
      while(av_audio_fifo_size(fifo) > 0) {
        TRACE("av_audio_fifo_size: %d", av_audio_fifo_size(fifo));
        //Encode and write audio samples from the FIFO buffer to the output container
        CHK_ERROR(load_encode_and_write(fifo, output_format_context, output_codec_context));
      }

      //Flush the encoder as it may have delayed frames.
      int data_written = 0;
      do {
        CHK_ERROR(encode_audio_frame(NULL, output_format_context, output_codec_context, &data_written));
      } while(data_written);

      //Write the trailer of the output file container
      CHK_ERROR(av_write_trailer(output_format_context));

      flushed = true;

      goto cleanup;
    }

    // Load some more input samples
    // These input buffers are varying sizes (not Frame size)
    // The samples are converted to 16 bit Integer are put into a Fifo
    // When at least a Frame's worth of data is in the Fifo, a Frame is read
    // Before the first Frame is read,
    // A Codec converts the input PCM Frame to a AAC Frame
    // The AAC Frame is written to the AAC Stream of the output
    CHK_NULL(i_data);

    //Package the incoming payload into a convenient data structure
    struct buffer_data input_bd = {.ptr = i_data, .size = (size_t)i_length, .offset = 0};

    //Assign the incoming payload to the custom io of `input_format_context`
    input_format_context->pb->opaque = &input_bd;

    const int output_frame_size = output_codec_context->frame_size;
    int finished = 0;

    //Loop as long as the transcoding process has not finished
    while(!finished)
    {
      TRACE("Not finished yet...");
      //Make sure that there is one frame worth of samples in the FIFO
      // buffer so that the encoder can do its work.
      //
      // Since the decoder's and the encoder's frame size may differ, we
      // need the FIFO buffer to store as many frames worth of input samples
      // that they make up at least one frame worth of output samples.
      //
      // Also, if the end of the input is reached, proceed to the encoding procedure
      TRACE("av_audio_fifo_size(fifo)=%d < output_frame_size=%d && !finished=%d)",av_audio_fifo_size(fifo),output_frame_size,!finished);
      while(av_audio_fifo_size(fifo) < output_frame_size && !finished) {
            //Decode one frame worth of audio samples, convert it to the
            // output sample format and put it into the FIFO buffer.
            CHK_ERROR(read_decode_convert_and_store(fifo, input_format_context, input_codec_context,
                                                    output_codec_context, resample_context, &finished));
            TRACE("av_audio_fifo_size(fifo)=%d < output_frame_size=%d && !finished=%d)",av_audio_fifo_size(fifo),output_frame_size,!finished);
      }

      //If there are enough samples for the encoder, encode them.
      TRACE("av_audio_fifo_size(fifo)=%d >= output_frame_size=%d", av_audio_fifo_size(fifo), output_frame_size);
      while(av_audio_fifo_size(fifo) >= output_frame_size) {
        //Encode and write audio samples from the FIFO buffer to the output container
        CHK_ERROR(load_encode_and_write(fifo, output_format_context, output_codec_context));
        TRACE("av_audio_fifo_size(fifo)=%d >= output_frame_size=%d", av_audio_fifo_size(fifo), output_frame_size);
      }
    }

cleanup:
    //If there were an error, clean up accordingly and exit with an error status
    if(_error != NO_ERROR)
        dispose(1); //Calls `exit(1)` internally

    load_locked = false; //Unlock the load once it has finished on success

    return 0;
}


//Clean up everything
void clear()
{
    //LOG("Started Bulgaria: %s", __TIME__);

    //Codecs have no contained elements, so only the top-level needs to be free'd
    //closing the context frees the Streams inside
    if(input_codec_context) {
        avcodec_close(input_codec_context);
        avcodec_free_context(&input_codec_context);
        input_codec_context = NULL;
    }
    if(output_codec_context) {
        avcodec_close(output_codec_context);
        avcodec_free_context(&output_codec_context);
        output_codec_context = NULL;
    }

    //Free the format contexts along with their contained elements
    //
    // If the format context initialized correctly (ie: bears a non-NULL value), then all of
    // its contained elements must have been initialized properly as well
    //
    if(input_format_context)
    {
        unsigned int i;
        for ( i = 0; i < input_format_context->nb_streams; i++ )
        {
            //av_freep(&input_format_context->streams[i]->codec);
            av_freep(&input_format_context->streams[i]);
        }
        av_free(input_format_context->pb->buffer);
        av_free(input_format_context->pb);
        avformat_free_context(input_format_context);
        input_format_context = NULL;
    }

    if(output_format_context)
    {
        unsigned int i;
        for ( i = 0; i < output_format_context->nb_streams; i++ )
        {
            //av_freep(&output_format_context->streams[i]->codec);
            av_freep(&output_format_context->streams[i]);
        }
        av_free(((struct buffer_data*)output_format_context->pb->opaque)->ptr);
        av_free(output_format_context->pb->opaque);
        av_free(output_format_context->pb->buffer);
        av_free(output_format_context->pb);
        avformat_free_context(output_format_context);
        output_codec_context = NULL;
    }

    if(resample_context) {
        swr_free(&resample_context);
        resample_context = NULL;
    }

    if(fifo) {
        av_audio_fifo_free(fifo);
        fifo = NULL;
    }
}

//Clean up everything and exit
void dispose(int status)
{
    clear();

    #ifdef __EMSCRIPTEN__
    emscripten_force_exit(status);
    #endif

    exit(status);
}

char *get_output_format()
{
    TRACE("(%s)", output_format_context->oformat->name);
    return (char*)output_format_context->oformat->name;
}

char *get_output_codec()
{
    TRACE("(%s)", output_codec_context->codec->name);
    return (char*)output_codec_context->codec->name;
}

int get_output_sample_rate()
{
    TRACE("(%d)", output_codec_context->sample_rate);
    return output_codec_context->sample_rate;
}

int get_output_channels()
{
    TRACE("(%d)", output_codec_context->channels);
    return output_codec_context->channels;
}

uint8_t *get_output_pointer()
{
    uint8_t *output_ptr = ((struct buffer_data*)output_format_context->pb->opaque)->ptr;
    TRACE("(%p)", output_ptr);
    return output_ptr;
}

int get_output_length()
{
    //The output buffer's offset is located at the output format context's io payload's data offest
    int offset = ((struct buffer_data*)output_format_context->pb->opaque)->offset;
    TRACE("(%d)", offset);
    return offset;
}

int get_load_locked_status()
{
    int load_locked_status = (int) load_locked;
    TRACE("(%d)", load_locked_status);
    return load_locked_status;
}

int tryit(size_t req) {
    unsigned char *p = malloc(req);
    if(p) {
        free(p);
        return 1;
    } else return 0;
}

/*
    We know we can alloc min bytes
    But don't know if we can alloc max bytes
*/
size_t available(size_t max,size_t min)
{
   LOG("available(%zd,%zd)",max,min);
   if(max<=min) {
       return max;
   } else {
       if(tryit(max)) {
           return available( max*2, max);
       } else {
           return available( max/2, min);
       }
    }

}

void decode()
{
    int in = open("../../microphone/src/test/resources/audio.raw", O_RDONLY);
    TRACE("open() --> %d",in);

    #define FRAME_SIZE 4096
    unsigned char buffer[FRAME_SIZE];
    int bytesRead = read(in, buffer, FRAME_SIZE);
    while(bytesRead > 0) {
        load(buffer,bytesRead);
        bytesRead = read(in, buffer, FRAME_SIZE);
    }
    load(0,0);
    close(in);
}

int main(int argc, char **argv)
{
    INFO("build: %s, %s", __DATE__, __TIME__);

    av_log_set_callback(av_log_encoder);

    #ifdef __EMSCRIPTEN__
    emscripten_exit_with_live_runtime();
    #endif

    #ifdef __FLASHPLAYER__
    AS3_GoAsync();
    #endif

    #ifdef __TEST__
    while( 1 ) {
    //LOG("Available=%ld",available(4096,0));
    init(
        "f32be", //const char *i_format_name,
        "pcm_f32be", //const char *i_codec_name,
        16000, //int i_sample_rate,
        1, //int i_channels,
        "mp4", //const char *o_format_name,
        "aac", //const char *o_codec_name,
        16000, //int o_sample_rate,
        1, //int o_channels,
        16*16000, //int o_bit_rate,
        10 //int o_buffer_max_seconds
    );

    decode();
    clear();
    sleep(5);
    //LOG("Available=%ld",available(4096,0));

    }
    #endif
}
