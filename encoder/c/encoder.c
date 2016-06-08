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
    0 = no error, otherwise get_error_text returns a friendly message

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

// max of 30 seconds at 32k bits/sec
const int max_input_length = (32000 / 8) * 30;

// max of 30 seconds at 44100khz
const int max_output_length = 44100 * 4 * 30;

AVAudioFifo *fifo;

uint8_t *input_frame_buffer;
AVFrame *input_frame;

AVCodecContext *input_codec_context;

uint8_t *output_buffer;
int output_buffer_length;
int output_buffer_pos;

AVCodecContext *output_codec_context;
AVFormatContext *output_context;

bool passthru_encoding = false;

#define INTERNAL_ERROR 1
#define NO_ERROR 0
#define ERROR_CODE int
#define LOG(x) fprintf(stdout,"%s\n", x)
#define LOG1(x, y) fprintf(stdout,"%s = %d\n", x, y)
#define ERROR0(s, x) fprintf(stderr, s, x)
#define ERROR2(s, x, y, z) fprintf(stderr, s, x, y, z)
#define CHK_NULL(x)  { LOG(#x); if(!(x)) { ERROR0("%s FAILED", #x); exit(1); }}
#define CHK_ERROR(x) { LOG(#x); int err=(x); if(err<0) { ERROR2("%s FAILED code=%d %s\n", #x, err, get_error_text(err)); exit(1); }}
#define CHK_GE(x, y) { LOG(#x); int err=(x); if(err<y) { ERROR2("%s FAILED %d < %d\n", #x, err, y); exit(1); }}
#define CHK_VOID(x)  { LOG(#x); x; }

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

int main(int argc, char **argv) {
    fprintf(stdout,"%s\n", "main");

    #ifdef __EMSCRIPTEN__
    emscripten_exit_with_live_runtime();
    #endif

    #ifdef __FLASHPLAYER__
    AS3_GoAsync();
    #endif
}

AVCodecContext *init_codec_context(AVCodec *codec, int sample_rate, int channels, int bit_rate) {

    AVCodecContext *codec_context;

    /** Create a new codec context. */
    CHK_NULL(codec_context = avcodec_alloc_context3(codec));

    /** Check that codec can handle the input */
    //CHK_NULL(check_sample_rate(codec, sample_rate)); //TODO:pcm decoders have no sample rates . . . .

    /** Parameters for codec */
    codec_context->sample_fmt     = codec->sample_fmts[0];
    codec_context->sample_rate    = sample_rate;
    codec_context->channels       = channels;
    codec_context->channel_layout = av_get_default_channel_layout(channels);
    if(bit_rate > 0) {
        codec_context->bit_rate       = bit_rate;
    }

    /** Open the Codec */
    CHK_ERROR(avcodec_open2(codec_context, codec, NULL));

    return codec_context;
}

AVFrame *init_input_frame(AVCodecContext *i_codec_context, AVCodecContext *o_codec_context) {

    AVFrame *frame;

    /* Use the encoder's desired frame size for processing. */
    int frame_size = o_codec_context->frame_size;
    LOG1("frame_size", frame_size);

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

    //ADDED comment
    /* setup the data pointers in the AVFrame */ 
    CHK_ERROR(avcodec_fill_audio_frame(frame,
        o_codec_context->channels,
        o_codec_context->sample_fmt,
        (const uint8_t*)input_frame_buffer,
        frame_size, 0));
                                                 
    //ADDED
    //av_frame_get_buffer(frame, 0);
    
    return frame;
}

int read_packet(void* ptr, uint8_t* buf, int buf_size) {
    fprintf(stdout,"read_packet(%p %s %d)\n", ptr, buf, buf_size);
    return buf_size;
}

int write_packet(void* ptr, uint8_t* buf, int buf_size) {
    fprintf(stdout,"write_packet(%p %s %d)\n", ptr, buf, buf_size);
    memcpy(output_buffer + output_buffer_pos, buf, buf_size);
    output_buffer_pos += buf_size;
    LOG1("  output_buffer_pos", output_buffer_pos);
    return buf_size;
}

int64_t seek(void* ptr, int64_t offset, int whence) {
   fprintf(stdout, "seek_packet(%p %lld %d)\n", ptr, (long long)offset, whence);
   return offset;
}

AVIOContext *init_io(AVCodecContext *i_codec_context, AVCodecContext *o_codec_context) {
    CHK_NULL(input_frame = init_input_frame(i_codec_context, o_codec_context));

    /** Create the input FIFO buffer based on the Codec input format */
    CHK_NULL(fifo = av_audio_fifo_alloc(
        o_codec_context->sample_fmt,
        o_codec_context->channels, 1));

    //Initialize an arbitrary size `output_buffer`
    output_buffer_length = 1000000;
    CHK_NULL(output_buffer = av_malloc(output_buffer_length));
    output_buffer_pos = 0;

    // Allocate the AVIOContext:
    // The fourth parameter (pStream) is a user parameter which will be passed to our callback functions
    AVIOContext *io;
    CHK_NULL(io = avio_alloc_context(output_buffer, output_buffer_length,  // internal Buffer and its size
                                             1,     // bWriteable (1=true,0=false)
                                             (void*)0xdeadbeef,   // user data ; will be passed to our callback functions
                                             read_packet,
                                             write_packet,
                                             seek));
    return io;
}

AVFormatContext *init_output(AVIOContext *io_context, const char *o_format)
{
    AVFormatContext *o_context;

    /** Create a new format context for the output container format. */
    CHK_NULL(o_context = avformat_alloc_context());

    /** Associate the output file (pointer) with the container format context. */
    o_context->pb = io_context;

    /** Set the container format to output_format */
    CHK_NULL(o_context->oformat = av_guess_format(o_format, NULL, NULL));

    /**
     * Some container formats (like MP4) require global headers to be present
     * Mark the encoder so that it behaves accordingly.
     */
    if (o_context->oformat->flags & AVFMT_GLOBALHEADER)
        output_codec_context->flags |= AV_CODEC_FLAG_GLOBAL_HEADER;

    /** Create a new audio stream in the output file container. */
    AVStream *output_stream;
    CHK_NULL(output_stream = avformat_new_stream(o_context, output_codec_context->codec));

    output_stream->codec->sample_fmt     = output_codec_context->sample_fmt;
    output_stream->codec->sample_rate    = output_codec_context->sample_rate;
    output_stream->codec->channels       = output_codec_context->channels;
    output_stream->codec->channel_layout = output_codec_context->channel_layout;
    output_stream->codec->bit_rate       = output_codec_context->bit_rate;
    output_stream->codec->frame_size     = output_codec_context->frame_size;
    output_stream->codec->flags          = output_codec_context->flags;

    /** Set the sample rate for the container. */
    output_stream->time_base.den = output_stream->codec->sample_rate;
    output_stream->time_base.num = 1;

    CHK_ERROR(avformat_write_header(o_context, NULL));    /* Write the Header to the output Container */

    return o_context;
}


/* check that a given sample format is supported by the encoder */
int check_sample_rate(AVCodec *codec, int sample_rate)
{
    LOG1("check_sample_rate", sample_rate);
    const int *p = codec->supported_samplerates;
    while (*p != 0) {
        LOG1(" available", *p);

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
          int i_channels, const char *o_codec_name, const char *o_format,
          int o_sample_rate, int o_channels, int o_bit_rate)
{
    fprintf(stdout, "init(%s, %s, %d, %d, %s, %s, %d, %d, %d)\n",
            i_format_name, i_codec_name, i_sample_rate, i_channels, o_codec_name,
            o_format, o_sample_rate, o_channels, o_bit_rate);

    passthru_encoding = strcmp(i_codec_name, o_codec_name);

    /** Register all codecs and formats so that they can be used. */
    av_register_all();

    AVCodec *i_codec;
    CHK_NULL(i_codec = avcodec_find_decoder_by_name(i_codec_name));
    CHK_NULL(input_codec_context = init_codec_context(i_codec, i_sample_rate, i_channels, -1));

    AVCodec *o_codec;
    CHK_NULL(o_codec = avcodec_find_encoder_by_name(o_codec_name));
    CHK_NULL(output_codec_context = init_codec_context(o_codec, o_sample_rate, o_channels, o_bit_rate));

    AVIOContext *io_context = NULL;
    CHK_NULL(io_context = init_io(input_codec_context, output_codec_context));

    CHK_NULL(output_context = init_output(io_context, o_format));
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
void load(uint8_t *i_data, int i_length) {
    LOG1("load i_length", i_length);

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
    LOG1("  before fifo space", av_audio_fifo_space(fifo));
    LOG1("    input_samples_size", input_samples_size);
    LOG1("  before fifo size", av_audio_fifo_size(fifo));
    CHK_GE(av_audio_fifo_write(fifo, (void**)&i_data, input_samples_size), input_samples_size);
    LOG1("  after fifo space", av_audio_fifo_space(fifo));
    LOG1("  after fifo size", av_audio_fifo_size(fifo));
    
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
    while(av_audio_fifo_size(fifo) >= frame_samples_size) {
        fprintf(stdout, "BEFORE %p %p\n", input_frame_buffer, &input_frame_buffer);
      
        LOG1("  before fifo size", av_audio_fifo_size(fifo));
        CHK_ERROR(amount_read = av_audio_fifo_read(fifo, (void**)input_frame->data, frame_samples_size));
        LOG1("  amount_read", amount_read);
        LOG1("  after fifo size", av_audio_fifo_size(fifo));

        fprintf(stdout, "AFTER %p %p %p %p %lld\n", input_frame_buffer, &input_frame_buffer, input_frame->data, input_frame->extended_data, input_frame->pts);

        LOG1("  output packet before size", output_packet->size);
        
        int got_output = 0;
        CHK_ERROR(avcodec_encode_audio2(output_codec_context, output_packet, input_frame, &got_output));
        LOG1("  got_output", got_output);
        LOG1("  output packet size", output_packet->size);
        if(got_output) {
            CHK_ERROR(av_write_frame(output_context, output_packet));
            CHK_VOID(av_packet_unref(output_packet));
        }
    }
}

uint8_t *flush() {
    LOG("flush");

    /** Get all the delayed frames */
    AVPacket *output_packet;
    CHK_NULL(output_packet=av_packet_alloc());
    int got_output = 0;
    do {
        CHK_ERROR(avcodec_encode_audio2(output_codec_context, output_packet, NULL, &got_output));
        LOG1("  got_output",got_output);
        if(got_output) {
            LOG1("    output_packet size",output_packet->size);
            CHK_VOID(av_packet_unref(output_packet));
        }
    } while(got_output);
    CHK_ERROR(av_write_trailer(output_context));
    return output_buffer;
}

/**
 * Finish the output Container, and return the contents buffer and length
 */
void dispose(int status) {

    LOG("dispose\n");

    /* If there is a partial Frame left over in the Fifo, process it */

    /* Write the tail to the Container and close it */

    /* Get the Container contents */

    #ifdef __EMSCRIPTEN__
    emscripten_force_exit(status);
    #endif

    exit(status);
}

int get_output_sample_rate() {
    LOG1("get_output_sample_rate", output_codec_context->sample_rate);
    return output_codec_context->sample_rate;
}

char *get_output_format() {
    fprintf(stdout,"get_output_format name:%s\n", output_context->oformat->name);
    return (char *)output_context->oformat->name;
}

int get_output_length() {
    LOG1("get_output_length", output_buffer_pos);
    return output_buffer_pos;
}
