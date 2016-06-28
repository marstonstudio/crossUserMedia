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
#include <stdlib.h>
#include <unistd.h>
#include <string.h>
#include <stdarg.h>
#include <stdbool.h>

#include "libavformat/avformat.h"
#include "libavformat/avio.h"
#include "libavcodec/avcodec.h"
#include "libavutil/audio_fifo.h"
#include "libavutil/avassert.h"
#include "libavutil/avstring.h"
#include "libavutil/frame.h"
#include "libavutil/opt.h"
#include "libswresample/swresample.h"

#ifdef __FLASHPLAYER__
#include "AS3/AS3.h"
#endif

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

//Initialize the global input and output contexts
AVCodecContext *input_codec_context = NULL;
AVFormatContext *input_format_context = NULL;

AVCodecContext *output_codec_context = NULL;
AVFormatContext *output_format_context = NULL;

SwrContext *resample_context = NULL;
AVAudioFifo *fifo = NULL;

bool passthru_encoding = false;
bool load_locked = false;

struct buffer_data {
    uint8_t *ptr;
    size_t size;
    int offset;
};

#define ERROR_CODE int
#define NO_ERROR 0
#define INTERNAL_ERROR -1

#define LOG(M, ...) fprintf(stdout, "LOG :: %s :: " M "\n", __FUNCTION__, ##__VA_ARGS__)
#define WARNING(M, ...) fprintf(stdout, "WARNING :: %s :: " M "\n", __FUNCTION__, ##__VA_ARGS__)
//The stream `stderr` already prints a prepended "ERROR :: " to its output text
#define ERROR(M, ...) fprintf(stderr, "%s :: " M "\n", __FUNCTION__, ##__VA_ARGS__)

#define CHK_VOID(x)                             \
    {                                           \
        LOG(#x);                                \
        x;                                      \
    }

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
#define CHK_NULL(x)                                             \
    do {                                                        \
        LOG(#x);                                                \
        if(!(x))                                                \
        {                                                       \
            ERROR("%s FAILED", #x);                             \
            _error = INTERNAL_ERROR; /*There was an error!*/    \
            goto cleanup;                                       \
        }                                                       \
    } while(0)

#define CHK_ERROR(x)                                                    \
    do {                                                                \
        LOG(#x);                                                        \
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
        LOG(#x);                                                        \
        int _tmp = (x);                                                 \
        if(_tmp < y)                                                    \
        {                                                               \
            ERROR("%s FAILED %d < %d", #x, _tmp, y);                    \
            _error = INTERNAL_ERROR; /*There was an error!*/            \
            goto cleanup;                                               \
        }                                                               \
    } while(0)

#define CHK_EQ(x, y)                                                    \
    do {                                                                \
        LOG(#x);                                                        \
        int _tmp = (x);                                                 \
        if(_tmp != y)                                                   \
        {                                                               \
            ERROR("%s FAILED %d != %d", #x, _tmp, y);                   \
            _error = INTERNAL_ERROR; /*There was an error!*/            \
            goto cleanup;                                               \
        }                                                               \
    } while(0)
          
//Convert an error code into its corresponding error text message (not thread-safe).
static const char *get_error_text(const ERROR_CODE error)
{
    static char error_buffer[255];
    av_strerror(error, error_buffer, sizeof(error_buffer));
    return error_buffer;
}

//To be registered with `on_exit`. Calls `av_free` on the input `arg`.
static void av_free_on_exit(int status, void *arg)
{
    LOG("Called from status: %d", status);
    CHK_VOID(av_free(arg));
}

int main(int argc, char **argv)
{
    LOG("Started");

    #ifdef __EMSCRIPTEN__
    emscripten_exit_with_live_runtime();
    #endif

    #ifdef __FLASHPLAYER__
    AS3_GoAsync();
    #endif
}

int input_read(void *ptr, uint8_t *buf, int buf_size)
{
    struct buffer_data *bd = (struct buffer_data*)ptr;

    //Sanity check
    if(!bd)
    {
        WARNING("NULL ptr buffer encountered");
        return 0;
    }
    
    const int data_left = bd->size - bd->offset;
    LOG("bd->ptr: %p bd->offset: %d data_left: %d buf_size: %d", bd->ptr, bd->offset, data_left, buf_size);

    //Overflow protection
    if(buf_size > data_left)
    {
        buf_size = data_left;
        WARNING("Read overflow encountered");
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
    LOG("bd->ptr: %p bd->size: %d bd->offset: %d space_left: %d buf_size: %d",
        bd->ptr, bd->size, bd->offset, space_left, buf_size);

    //Overflow protection
    if(buf_size > space_left)
    {
        buf_size = space_left;
        WARNING("Write overflow encountered");
    }
    
    memcpy(bd->ptr + bd->offset, buf, buf_size);
    bd->offset += buf_size;
    LOG("bd->offset: %d", bd->offset);
    
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
    
    
    LOG("bd->ptr: %p bd->size: %d bd->offset %d offset: %lld whence: %d",
        bd->ptr, bd->size, bd->offset, offset, whence);

    //Overflow protection
    if(offset >= bd->size)
    {
        WARNING("Seek overflow encountered");
        return 0;
    }
    
    bd->offset = offset;
    LOG("bd->offset: %d", bd->offset);
    
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
    
    //Create a resampler context for the conversion.
    // Set the conversion parameters.
    // Default channel layouts based on the number of channels
    // are assumed for simplicity (they are sometimes not detected
    // properly by the demuxer and/or decoder).
    CHK_NULL(r_context = swr_alloc_set_opts(NULL, av_get_default_channel_layout(o_codec_context->channels),
                                            o_codec_context->sample_fmt, o_codec_context->sample_rate,
                                            av_get_default_channel_layout(i_codec_context->channels),
                                            i_codec_context->sample_fmt, i_codec_context->sample_rate,
                                            0, NULL));
    
    //Perform a sanity check so that the number of converted samples is
    // not greater than the number of samples to be converted.
    // If the sample rates differ, this case has to be handled differently
    CHK_EQ(o_codec_context->sample_rate == i_codec_context->sample_rate, true);

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

AVFormatContext *init_output_format_context(const char *o_format)
{
    ERROR_CODE _error = NO_ERROR;

    //Instantiate the variables of this function before any CHK macros    
    uint8_t *output_data = NULL;
    struct buffer_data *output_bd = NULL;
    AVIOContext *output_io_context = NULL;
    AVFormatContext *o_context = NULL;    
    AVStream *output_stream = NULL;    
    
    //Allocate space for the buffer to contain the output data
    //TODO: is the output really at 44100 khz
    const int max_output_length = 44100 * 4 * 30; //Max of 30 seconds at 44100khz
    CHK_NULL(output_data = (uint8_t*)av_malloc(max_output_length));
    
    //Initialize the internal input buffer data for its custom io
    CHK_NULL(output_bd = (struct buffer_data*)av_malloc(sizeof(struct buffer_data)));
    *output_bd = (struct buffer_data){.ptr = output_data, .size = (size_t)max_output_length, .offset = 0};
    LOG("output_bd: ptr: %p, size: %d, offset %d", output_bd->ptr, output_bd->size, output_bd->offset);
    
    //Initialize the output's custom io
    CHK_NULL(output_io_context = init_io(output_bd, 1, NULL, &output_write, &output_seek));
    
    //Create a new format context for the output container format.
    CHK_NULL(o_context = avformat_alloc_context());

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
        if(output_data)
            av_free(output_data);
        if(output_bd)
            av_free(output_bd);

        //If the `output_io_context` was initialized correctly (ie: bears a non-NULL value), then
        // its internal buffer must have initialized properly as well
        if(output_io_context)
        {
            av_free(output_io_context->buffer);
            av_free(output_io_context);
        }
        
        if(o_context)
            avformat_free_context(o_context);

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
        LOG(" available: %d", *p);

        if (*p == sample_rate)
            return 1;
        p++;
    }
    return 0;
}

//Create MP4 AAC output Container to be returned by `flush`
void init(const char *i_format_name, const char *i_codec_name, int i_sample_rate,
          int i_channels, const char *o_format_name, const char *o_codec_name,
          int o_sample_rate, int o_channels, int o_bit_rate)
{
    ERROR_CODE _error = NO_ERROR;

    //Instantiate the variables of this function before any CHK macros
    AVCodec *i_codec = NULL, *o_codec = NULL;
    
    LOG("(%s, %s, %d, %d, %s, %s, %d, %d, %d)",
        i_format_name, i_codec_name, i_sample_rate, i_channels,
        o_format_name, o_codec_name, o_sample_rate, o_channels, o_bit_rate);

    //Enable the `passthru_encoding` if both the input and output codec names are the same
    passthru_encoding = !strcmp(i_codec_name, o_codec_name);
    
    LOG("passthru_encoding: %s", passthru_encoding ? "true" : "false");

    //Register all codecs and formats so that they can be used.
    av_register_all();

    //
    //Initialize input contexts
    //
    
    //Create an input codec context given the input header information
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
    CHK_NULL(output_format_context = init_output_format_context(o_format_name));

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
    //If there were an error, clean up accordingly
    if(_error != NO_ERROR)
    {
        //Codecs have no contained elements, so only the top-level needs to be free'd
        if(input_codec_context)
            avcodec_free_context(&input_codec_context);
        if(output_codec_context)
            avcodec_free_context(&output_codec_context);

        //Free the format contexts along with their contained elements
        //
        // If the format context initialized correctly (ie: bears a non-NULL value), then all of
        // its contained elements must have been initialized properly as well
        //
        if(input_format_context)
        {
            av_free(input_format_context->pb->buffer);
            av_free(input_format_context->pb);
            avformat_free_context(input_format_context);
        }
        
        if(output_format_context)
        {
            av_free(((struct buffer_data*)output_format_context->pb->opaque)->ptr);
            av_free(output_format_context->pb->opaque);
            av_free(output_format_context->pb->buffer);
            av_free(output_format_context->pb);
            avformat_free_context(output_format_context);
        }
        
        if(resample_context)
            swr_free(&resample_context);
        
        //There is no need to handle `fifo` because if it passed, as it is the last operation in
        // this function, then this error cleanup routine would never be executed
        
        //Exit on error
        exit(1);
    }
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
ERROR_CODE convert_samples(const uint8_t **input_data, uint8_t **converted_data,
                           const int frame_size, SwrContext *r_context)
{
    ERROR_CODE _error = NO_ERROR;

    //Convert the samples using the resampler
    CHK_ERROR(swr_convert(r_context, converted_data, frame_size, input_data, frame_size));

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
    if((_error = av_read_frame(i_format_context, &input_packet)) < 0)
    {
        //If this is an end of file error, it will not be treated as an error, only a signal
        if(_error == AVERROR_EOF)
        {
            *finished = 1;
            _error = NO_ERROR; //Clear the EOF error
        }else{
            ERROR("Could not read frame ('%s')", get_error_text(_error));
            goto cleanup;
        }
    }

    //Decode the audio frame stored in the temporary packet. An empty `input_packet` will flush the decoder.
    CHK_ERROR(avcodec_decode_audio4(i_codec_context, frame, data_present, &input_packet));

    //If the decoder has not been flushed completely, then this function is not completely finished.
    if(*finished && *data_present)
        *finished = 0;

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
    uint8_t **converted_input_samples = NULL; //Temporary storage for the converted input samples.
    int data_present = 0;

    //Initialize temporary storage for one input frame.
    CHK_NULL(input_frame = av_frame_alloc());
    
    //Decode one frame worth of audio samples.
    CHK_ERROR(decode_audio_frame(input_frame, i_format_context, i_codec_context, &data_present, finished));
    
    //If end of the input is reached and there are no more samples in the decoder which are
    // delayed, the decoder finally fully finished.
    if(*finished && !data_present)
        goto cleanup;
    
    //If there is decoded data, convert and store it
    if(data_present)
    {
        //Initialize the temporary storage for the converted input samples.
        CHK_ERROR(init_converted_samples(&converted_input_samples, o_codec_context, input_frame->nb_samples));

        //Convert the input samples to the desired output sample format. This requires a
        // temporary storage provided by converted_input_samples.
        CHK_ERROR(convert_samples((const uint8_t**)input_frame->extended_data, converted_input_samples,
                                  input_frame->nb_samples, r_context));

        //Add the converted input samples to the FIFO buffer for latter processing.
        CHK_ERROR(add_samples_to_fifo(audio_fifo, converted_input_samples, input_frame->nb_samples));
    }

cleanup:
    if(input_frame)
        av_frame_free(&input_frame);
    
    if(converted_input_samples)
    {
        av_freep(&converted_input_samples[0]);
        free(converted_input_samples);
    }
    
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
    
    //A persistent timestamp for the audio frames
    static int64_t pts = 0;
    
    //Packet used for temporary storage.
    AVPacket output_packet;
    int error;
    init_packet(&output_packet);

    //Set a timestamp based on the sample rate for the container.
    if(frame)
    {
        frame->pts = pts;
        pts += frame->nb_samples;
    }

    //Encode the audio frame and store it in the temporary packet.
    CHK_ERROR(avcodec_encode_audio2(o_codec_context, &output_packet, frame, data_present));

    //Write one audio frame from the temporary packet to the output file.
    if(*data_present)
        CHK_ERROR(av_write_frame(o_format_context, &output_packet));

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
    int data_written;

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

//Peter: we are actually not using FDK AAC Codec; we are using the new ffmpeg native codec

/**
    Load some more input samples

    We are using the FDK AAC Codec
    http://wiki.hydrogenaud.io/index.php?title=Fraunhofer_FDK_AAC#Sample_Format
    The FDK library is based on fixed-point math and only supports 16-bit integer PCM input.

    These input buffers are varying sizes (not Frame size)
    The samples are converted to 16 bit Integer are put into a Fifo

    When at least a Frame's worth of data is in the Fifo,
    a Frame is read

    Before the first Frame is read,

    A Codec converts the input PCM Frame to a AAC Frame

    The AAC Frame is written to the AAC Stream of the output
*/
void load(uint8_t *i_data, int i_length)
{
    ERROR_CODE _error = NO_ERROR;

    //The `load_locked` must be false. If the load is locked (ie: another load call had been issued
    // before a previous one returned) then error. This function is meant to be synchronous.
    CHK_EQ(load_locked, false);
    load_locked = true; //Now lock the load function
    
    LOG("i_length: %d", i_length);
    
    //Package the incoming payload into a convenient data structure
    struct buffer_data input_bd = {.ptr = i_data, .size = (size_t)i_length, .offset = 0};
    
    //Assign it the incoming payload
    input_format_context->pb->opaque = &input_bd;
    
    const int output_frame_size = output_codec_context->frame_size;
    int finished = 0;

    //Loop as long as the transcoding process has not finished
    while(!finished)
    {
        //Make sure that there is one frame worth of samples in the FIFO
        // buffer so that the encoder can do its work.
        //
        // Since the decoder's and the encoder's frame size may differ, we
        // need the FIFO buffer to store as many frames worth of input samples
        // that they make up at least one frame worth of output samples.
        //
        // Also, if the end of the input is reached, proceed to the encoding procedure
        while(av_audio_fifo_size(fifo) < output_frame_size && !finished)
        {
            //Decode one frame worth of audio samples, convert it to the
            // output sample format and put it into the FIFO buffer.
            CHK_ERROR(read_decode_convert_and_store(fifo, input_format_context, input_codec_context,
                                                    output_codec_context, resample_context, &finished));

        }

        //If there are enough samples for the encoder, encode them. At the end of the file,
        // pass the remaining samples to the encoder.
        while(av_audio_fifo_size(fifo) >= output_frame_size || (finished && av_audio_fifo_size(fifo) > 0))
        {
            LOG("av_audio_fifo_size: %d", av_audio_fifo_size(fifo));
            //Take one frame worth of audio samples from the FIFO buffer,
            // encode it and write it to the output container.
            CHK_ERROR(load_encode_and_write(fifo, output_format_context, output_codec_context));
        }
    }

    //ADDED
    goto cleanup;

    
    //
    //OTHER
    //

    /* ADDED comment
    int frame_size = output_codec_context->frame_size;
    int input_samples_size = i_length / sizeof(float);
    int frame_samples_size = frame_size / sizeof(float);

    //ADDED
    //input_samples_size = i_length;
    //frame_samples_size = frame_size;
    
    //Store the new samples in the FIFO buffer. The write function
    // internally automatically reallocates as needed.
    LOG("  before fifo space: %d", av_audio_fifo_space(fifo));
    LOG("    input_samples_size: %d", input_samples_size);
    LOG("  before fifo size: %d", av_audio_fifo_size(fifo));
    CHK_GE(av_audio_fifo_write(fifo, (void**)&i_data, input_samples_size), input_samples_size);
    LOG("  after fifo space: %d", av_audio_fifo_space(fifo));
    LOG("  after fifo size: %d", av_audio_fifo_size(fifo));
    
    AVPacket *output_packet;
    CHK_NULL(output_packet = av_packet_alloc());
    CHK_VOID(av_init_packet(output_packet));
    //Set the packet data and size so that it is recognized as being empty.
    output_packet->data = NULL;
    output_packet->size = 0;
    output_packet->pts = 0;

    int amount_read = 0; 
   
    //While there is at least one frame's worth of data in `fifo`,
    // encode the frame and write it to the output container
    while(av_audio_fifo_size(fifo) >= frame_samples_size)
    {
        LOG("BEFORE %p %p", input_frame_buffer, &input_frame_buffer);
      
        LOG("  before fifo size: %d", av_audio_fifo_size(fifo));
        CHK_ERROR(amount_read = av_audio_fifo_read(fifo, (void**)input_frame->data, frame_samples_size));
        LOG("  amount_read: %d", amount_read);
        LOG("  after fifo size: %d", av_audio_fifo_size(fifo));

        LOG("AFTER %p %p %p %p %lld", input_frame_buffer, &input_frame_buffer, input_frame->data, input_frame->extended_data, input_frame->pts);

        LOG("  output packet before size: %d", output_packet->size);
        
        int got_output = 0;
        CHK_ERROR(avcodec_encode_audio2(output_codec_context, output_packet, input_frame, &got_output));
        LOG("  got_output: %d", got_output);
        LOG("  output packet size: %d", output_packet->size);
        if(got_output)
        {
            CHK_ERROR(av_write_frame(output_format_context, output_packet));
            CHK_VOID(av_packet_unref(output_packet));
        }
    }
    */
    
cleanup: 
    //If there were an error, clean up accordingly
    if(_error != NO_ERROR)
    {
        //TODO Clean here
        
        //Exit on error
        exit(1);
    }
    
    load_locked = false; //Unlock the load once it has finished on success
    return;
}

uint8_t *flush()
{
    ERROR_CODE _error = NO_ERROR;
    
    LOG("Started");

    int data_written;
    //Flush the encoder as it may have delayed frames.
    do {
        CHK_ERROR(encode_audio_frame(NULL, output_format_context, output_codec_context, &data_written));
    } while(data_written);

    //Write the trailer of the output file container
    CHK_ERROR(av_write_trailer(output_format_context));

    //ADDED data hex-dump
    int i = 0;
    for(; i < ((struct buffer_data*)output_format_context->pb->opaque)->offset; i++)
    {
        fprintf(stdout, "%x", *(((struct buffer_data*)output_format_context->pb->opaque)->ptr + i));
    }

    LOG("");
    
    /* ADDED comments
    //Get all the delayed frames
    AVPacket *output_packet;
    CHK_NULL(output_packet = av_packet_alloc());
    int got_output = 0;
    do {
        CHK_ERROR(avcodec_encode_audio2(output_codec_context, output_packet, NULL, &got_output));
        LOG("  got_output: %d",got_output);
        if(got_output) {
            LOG("    output_packet size: %d",output_packet->size);
            CHK_VOID(av_packet_unref(output_packet));
        }
    } while(got_output);
    CHK_ERROR(av_write_trailer(output_format_context));
    */

cleanup:

    //TODO: make sure that stuff is handled correctly here
    //The output buffer is located at the output format context's io payload's data pointer
    return ((struct buffer_data*)output_format_context->pb->opaque)->ptr;
}

//Finish the output Container, and return the contents buffer and length
void dispose(int status)
{

    LOG("Started Bulgaria: %s", __TIME__);

    /* If there is a partial Frame left over in the Fifo, process it */

    /* Write the tail to the Container and close it */

    /* Get the Container contents */

    #ifdef __EMSCRIPTEN__
    emscripten_force_exit(status);
    #endif

    exit(status);
}

int get_output_sample_rate()
{
    LOG("get_output_sample_rate: %d", output_codec_context->sample_rate);
    return output_codec_context->sample_rate;
}

char *get_output_format()
{
    LOG("get_output_format name: %s", output_format_context->oformat->name);
    return (char*)output_format_context->oformat->name;
}

int get_output_length()
{
    //The output buffer's offset is located at the output format context's io payload's data offest
    int offset = ((struct buffer_data*)output_format_context->pb->opaque)->offset;
    LOG("output offset: %d", offset);
    return offset;
}
