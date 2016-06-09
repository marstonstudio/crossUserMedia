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

    To write the output Container to memory instead of a file
    we implement Custom IO for the output FormatContext
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

//Max of 30 seconds at 32k bits/sec
const int max_input_length = (32000 / 8) * 30;

uint8_t *input_frame_buffer = NULL;
AVFrame *input_frame = NULL;

//Initialize the global input and output contexts
AVCodecContext *input_codec_context = NULL;
AVInputFormat *input_format = NULL;
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
#define ERROR(M, ...) fprintf(stderr, "ERROR :: %s :: " M "\n", __FUNCTION__, ##__VA_ARGS__)

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
#define CHK_NULL(x)                                             \
    do {                                                        \
        LOG(#x);                                                \
        if(!(x))                                                \
        {                                                       \
            ERROR("%s FAILED", #x);                          \
            _error = INTERNAL_ERROR; /*There was an error!*/    \
            goto cleanup;                                       \
        }                                                       \
    } while(0)

#define CHK_ERROR(x)                                                    \
    do {                                                                \
        LOG(#x);                                                        \
        _error = (x);                                                   \
        if(_error < 0)                                                  \
        {                                                               \
            ERROR("%s FAILED code=%d %s", #x, _error, get_error_text(_error)); \
            _error = INTERNAL_ERROR; /*There was an error!*/            \
            goto cleanup;                                               \
        }                                                               \
    } while(0)

#define CHK_GE(x, y)                                                    \
    do {                                                                \
        LOG(#x);                                                        \
        _error = (x);                                                   \
        if(_error < y)                                                  \
        {                                                               \
            ERROR("%s FAILED %d < %d", #x, _error, y);               \
            _error = INTERNAL_ERROR; /*There was an error!*/            \
            goto cleanup;                                               \
        }                                                               \
    } while(0)

#define CHK_EQ(x, y)                                                    \
    do {                                                                \
        LOG(#x);                                                        \
        _error = (x);                                                   \
        if(_error != y)                                                 \
        {                                                               \
            ERROR("%s FAILED %d != %d", #x, _error, y);              \
            _error = INTERNAL_ERROR; /*There was an error!*/            \
            goto cleanup;                                               \
        }                                                               \
    } while(0)
          
/**
 * Convert an error code into a text message.
 * @param error Error code to be converted
 * @return Corresponding error text (not thread-safe)
 */
static const char *get_error_text(const ERROR_CODE error)
{
    static char error_buffer[255];
    av_strerror(error, error_buffer, sizeof(error_buffer));
    return error_buffer;
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
    const int data_left = bd->size - bd->offset;
    LOG("%p %d %d %d", bd->ptr, bd->offset, data_left, buf_size);

    //Overflow protection
    if(buf_size > data_left)
    {
        buf_size = data_left;
        ERROR("Read overflow encountered");
    }
    
    //Copy internal buffer data to `buf`
    memcpy(buf, bd->ptr + bd->offset, buf_size);
    bd->offset += buf_size;
    return buf_size;
}

//TODO: does output really need this read
int output_read(void *ptr, uint8_t *buf, int buf_size)
{
    LOG("%p %p %d", ptr, buf, buf_size);
    return buf_size;
}

int output_write(void *ptr, uint8_t *buf, int buf_size)
{
    struct buffer_data *bd = (struct buffer_data*)ptr;
    const int space_left = bd->size - bd->offset;    
    LOG("%p %d %d", bd->ptr, space_left, buf_size);

    //Overflow protection
    if(buf_size > space_left)
    {
        buf_size = space_left;
        ERROR("Write overflow encountered");
    }
    
    memcpy(bd->ptr + bd->offset, buf, buf_size);
    bd->offset += buf_size;
    LOG(" bd->offset: %s", bd->offset);
    return buf_size;
}

//TODO: does output really need this seek
int64_t output_seek(void *ptr, int64_t offset, int whence)
{
    LOG("%p %lld %d", ptr, offset, whence);
    return offset;
}

/* //TODO
AVIOContext *init_io(AVCodecContext *i_codec_context, AVCodecContext *o_codec_context)
{
    ERROR_CODE _error = NO_ERROR;
    
    CHK_NULL(input_frame = init_input_frame(i_codec_context, o_codec_context));

    // Create the input FIFO buffer based on the Codec input format
    CHK_NULL(fifo = av_audio_fifo_alloc(
        o_codec_context->sample_fmt,
        o_codec_context->channels, 1));

    //Initialize an arbitrary size `output_buffer`
    output_buffer_length = 1000000;
    CHK_NULL(output_buffer = av_malloc(output_buffer_length));
    output_buffer_pos = 0;

    //Allocate the AVIOContext:
    // The fourth parameter (pStream) is a user parameter which will be passed to our callback functions
    AVIOContext *io;
    CHK_NULL(io = avio_alloc_context(output_buffer, output_buffer_length, //Internal Buffer and its size
                                     1, // bWriteable (1=true,0=false)
                                     (void*)0xdeadbeef, //User data, will be passed to our callback functions
                                     output_read,
                                     output_write,
                                     output_seek));
cleanup:    
    return io;
    }
*/

AVCodecContext *init_codec_context(AVCodec *codec, int sample_rate, int channels, int bit_rate)
{
    ERROR_CODE _error = NO_ERROR;
    
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
    //If there were an error, cleanup accordingly    
    if(_error != NO_ERROR)
    {
        if(codec_context)
            avcodec_free_context(&codec_context);

        //Return NULL on error
        return NULL;
    }
    
    return codec_context;
}

//Initialize the audio resampler based on the input and output codec settings.
// If the input and output sample formats differ, a conversion is required
// libswresample takes care of this, but requires initialization.
SwrContext *init_resampler(AVCodecContext *i_codec_context, AVCodecContext *o_codec_context)
{
    ERROR_CODE _error = NO_ERROR;

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
    //If there were an error, cleanup accordingly
    if(_error != NO_ERROR)
    {
        if(r_context)
            swr_free(&r_context);

        //Return NULL on error
        return NULL;
    }
    
    return r_context;
}

AVFrame *init_input_frame(AVCodecContext *i_codec_context, AVCodecContext *o_codec_context)
{
    ERROR_CODE _error = NO_ERROR;
    
    AVFrame *frame;

    /* Use the encoder's desired frame size for processing. */
    int frame_size = o_codec_context->frame_size;
    LOG("frame_size: %s", frame_size);

    CHK_NULL(frame = av_frame_alloc());

    frame->nb_samples     = o_codec_context->frame_size;
    frame->format         = o_codec_context->sample_fmt;
    frame->channel_layout = o_codec_context->channel_layout;
    //ADDED
    //frame->sample_rate    = o_codec_context->sample_rate;

    /* the codec gives us the frame size, in samples,
     * we calculate the size of the samples buffer in bytes */
    CHK_ERROR(frame_size = av_samples_get_buffer_size(NULL,
        o_codec_context->channels,
        o_codec_context->frame_size,
        o_codec_context->sample_fmt, 0));

    CHK_NULL(input_frame_buffer = av_malloc(frame_size));

    /* setup the data pointers in the AVFrame */ 
    CHK_ERROR(avcodec_fill_audio_frame(frame,
        o_codec_context->channels,
        o_codec_context->sample_fmt,
        (const uint8_t*)input_frame_buffer,
        frame_size, 0));
                                                 
cleanup: //TODO    
    return frame;
}

AVIOContext *init_io(void *internal_data, int write_flag,
                        int(*read_packet)(void*, uint8_t*, int),
                        int(*write_packet)(void*, uint8_t*, int),
                        int64_t(*seek)(void*, int64_t, int))
{
    ERROR_CODE _error = NO_ERROR;
    
    //Allocate space for the custom io's internal buffer
    const int ioBufferSize = 4096;
    uint8_t *ioBuffer = NULL;
    CHK_NULL(ioBuffer = (uint8_t*)av_malloc(ioBufferSize));

    //Initialize the custom io
    AVIOContext *avioContext = NULL;
    CHK_NULL(avioContext = avio_alloc_context(ioBuffer, ioBufferSize, write_flag, &internal_data,
                                              read_packet, write_packet, seek));

cleanup:
    //If there were an error, cleanup accordingly
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

AVFormatContext *init_input_format_context(struct buffer_data *input_bd)
{
    ERROR_CODE _error = NO_ERROR;

    AVFormatContext *i_context = NULL;
    
    //Initialize the input's custom io
    AVIOContext *input_io_context = NULL;
    CHK_NULL(input_io_context = init_io(input_bd, 0, &input_read, NULL, NULL));
    
    //Allocate some space for the input format context and connect the custom io to it
    CHK_NULL(i_context = avformat_alloc_context());
    i_context->pb = input_io_context;

    //Initialize the input format context without an input file, but with a custom io and a manually set input format
    CHK_ERROR(avformat_open_input(&i_context, NULL, input_format, NULL));
    CHK_ERROR(avformat_find_stream_info(i_context, NULL));

cleanup:
    //If there were an error, cleanup accordingly
    if(_error != NO_ERROR)
    {
        if(input_io_context)
            av_free(input_io_context);
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
    
    AVFormatContext *o_context = NULL;

    //Allocate space for the buffer to contain the output data
    //TODO: is the output really at 44100 khz
    const int max_output_length = 44100 * 4 * 30; //Max of 30 seconds at 44100khz
    uint8_t *output_data = NULL;
    CHK_NULL(output_data = (uint8_t*)av_malloc(max_output_length));
    
    //Initialize the internal input buffer data for its custom io
    struct buffer_data *output_bd = NULL;
    CHK_NULL(output_bd = (struct buffer_data*)av_malloc(sizeof(struct buffer_data)));    
    *output_bd = (struct buffer_data){.ptr = output_data, .size = (size_t)max_output_length, .offset = 0};
    
    //Initialize the output's custom io
    AVIOContext *output_io_context = NULL;
    CHK_NULL(output_io_context = init_io(output_bd, 1, output_read, output_write, output_seek));
    
    //Create a new format context for the output container format.
    CHK_NULL(o_context = avformat_alloc_context());

    //Associate the output file (pointer) with the container format context.
    o_context->pb = output_io_context;

    //Set the container format to output_format
    CHK_NULL(o_context->oformat = av_guess_format(o_format, NULL, NULL));

    /**
     * Some container formats (like MP4) require global headers to be present
     * Mark the encoder so that it behaves accordingly.
     */
    if (o_context->oformat->flags & AVFMT_GLOBALHEADER)
        output_codec_context->flags |= AV_CODEC_FLAG_GLOBAL_HEADER;

    //Create a new audio stream in the output file container.
    AVStream *output_stream;
    CHK_NULL(output_stream = avformat_new_stream(o_context, output_codec_context->codec));

    output_stream->codec->sample_fmt     = output_codec_context->sample_fmt;
    output_stream->codec->sample_rate    = output_codec_context->sample_rate;
    output_stream->codec->channels       = output_codec_context->channels;
    output_stream->codec->channel_layout = output_codec_context->channel_layout;
    output_stream->codec->bit_rate       = output_codec_context->bit_rate;
    output_stream->codec->frame_size     = output_codec_context->frame_size;
    output_stream->codec->flags          = output_codec_context->flags;

    //Set the sample rate for the container.
    output_stream->time_base.den = output_stream->codec->sample_rate;
    output_stream->time_base.num = 1;

    //Write the Header to the output container
    CHK_ERROR(avformat_write_header(o_context, NULL));

cleanup:
    //If there were an error, cleanup accordingly
    if(_error != NO_ERROR)
    {
        if(output_data)
            av_free(output_data);
        if(output_bd)
            av_free(output_bd);
        if(output_io_context)
            av_free(output_io_context);        
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


/* check that a given sample format is supported by the encoder */
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

/**
    Create MP4 AAC output Container to be returned by flush()
*/
void init(const char *i_format_name, const char *i_codec_name, int i_sample_rate,
          int i_channels, const char *o_codec_name, const char *o_format_name,
          int o_sample_rate, int o_channels, int o_bit_rate)
{
    ERROR_CODE _error = NO_ERROR;
    
    LOG("(%s, %s, %d, %d, %s, %s, %d, %d, %d)",
        i_format_name, i_codec_name, i_sample_rate, i_channels, o_codec_name,
        o_format_name, o_sample_rate, o_channels, o_bit_rate);

    passthru_encoding = strcmp(i_codec_name, o_codec_name);

    //Register all codecs and formats so that they can be used.
    av_register_all();

    //
    //Initialize input contexts
    //
    
    //Create an input codec context given the input header information
    AVCodec *i_codec = NULL;
    CHK_NULL(i_codec = avcodec_find_decoder_by_name(i_codec_name));
    CHK_NULL(input_codec_context = init_codec_context(i_codec, i_sample_rate, i_channels, -1));
    
    //Since the input audio data is header-less, manually set its input format to a global variable
    CHK_NULL(input_format = av_find_input_format(i_format_name));
    
    //
    //Initialize output contexts
    //
    
    //Create an output codec context given the output header information
    AVCodec *o_codec = NULL;
    CHK_NULL(o_codec = avcodec_find_encoder_by_name(o_codec_name));
    CHK_NULL(output_codec_context = init_codec_context(o_codec, o_sample_rate, o_channels, o_bit_rate));
    
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
    //If there were an error, cleanup accordingly
    if(_error != NO_ERROR)
    {
        if(input_codec_context)
            avcodec_free_context(&input_codec_context);
        if(output_codec_context)
            avcodec_free_context(&output_codec_context);
        if(output_format_context)
            avformat_free_context(output_format_context);
        if(resample_context)
            swr_free(&resample_context);
        
        //There is no need to handle `fifo` because if it passed, as it is the last operation in
        // this function, then this error cleanup routine would never be executed
        
        //Exit on error
        exit(1);
    }
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
    
    //If this is the first time running `load`, fully initialize `input_format_context`, otherwise
    // simply assign it the incoming payload
    if(!input_format_context)
        CHK_NULL(input_format_context = init_input_format_context(&input_bd));
    else
        input_format_context->pb->opaque = &input_bd;
    
    //ADDED
    CHK_NULL(NULL);

/*
    if(passthru_encoding) {
        write_packet((void*)0xdeadbeef, i_data, i_length);
        return;
    }
*/
    int frame_size = output_codec_context->frame_size;
    int input_samples_size = i_length / sizeof(float);
    int frame_samples_size = frame_size / sizeof(float);

    //ADDED
    //input_samples_size = i_length;
    //frame_samples_size = frame_size;
    
  /**
    * Store the new samples in the FIFO buffer. The write function
    * internally automatically reallocates as needed.
    */
    LOG("  before fifo space: %d", av_audio_fifo_space(fifo));
    LOG("    input_samples_size: %d", input_samples_size);
    LOG("  before fifo size: %d", av_audio_fifo_size(fifo));
    CHK_GE(av_audio_fifo_write(fifo, (void**)&i_data, input_samples_size), input_samples_size);
    LOG("  after fifo space: %d", av_audio_fifo_space(fifo));
    LOG("  after fifo size: %d", av_audio_fifo_size(fifo));
    
    AVPacket *output_packet;
    CHK_NULL(output_packet=av_packet_alloc());
    CHK_VOID(av_init_packet(output_packet));
    /** Set the packet data and size so that it is recognized as being empty. */
    output_packet->data = NULL;
    output_packet->size = 0;
    output_packet->pts = 0;

    int amount_read = 0; 
   
    /**
     * While there is at least one frame's worth of data in `fifo`,
     * encode the frame and write it to the output container
     */
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
cleanup: //TODO
    //If there were an error, cleanup accordingly
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

    /** Get all the delayed frames */
    AVPacket *output_packet;
    CHK_NULL(output_packet=av_packet_alloc());
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

cleanup: //TODO

    //TODO: make sure that stuff is handled correctly here
    //The output buffer is located at the output format context's io payload's data pointer
    return ((struct buffer_data*)output_format_context->pb->opaque)->ptr;
}

/**
 * Finish the output Container, and return the contents buffer and length
 */
void dispose(int status)
{

    LOG("Started");

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
