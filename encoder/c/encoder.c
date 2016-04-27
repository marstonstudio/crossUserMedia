/**
  * User: jon, peter
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

uint8_t *output_buffer;
int output_buffer_length;
int output_buffer_pos;

AVCodecContext *codec_context;
AVFormatContext *output_context;

enum AVSampleFormat input_sample_fmt = AV_SAMPLE_FMT_FLTP;
int output_bit_rate = 96000;
int output_channels = 1;
int output_sample_rate = 0;
char *output_format = 0;

#define INTERNAL_ERROR 1
#define NO_ERROR 0
#define ERROR_CODE int
#define LOG(x) fprintf(stdout,"%s\n",x)
#define ERROR0(s,x) fprintf(stderr,s,x)
#define ERROR2(s,x,y,z) fprintf(stderr,s,x,y,z)
#define LOG1(x,y) fprintf(stdout,"%s = %d\n",x,y)
#define CHK_NULL(x) { LOG(#x); if(!(x)) { ERROR0("%s FAILED",#x); return; }}
#define CHK_ERROR(x) { LOG(#x); int err=(x); if(err<0) { ERROR2("%s FAILED code=%d %s\n",#x,err,get_error_text(err)); return; }}
#define CHK_GE(x,y) { LOG(#x); int err=(x); if(err<y) { ERROR2("%s FAILED %d < %d\n",#x,err,y); return; }}
#define CHK_VOID(x) { LOG(#x); x; }

int main(int argc, char **argv) {
    fprintf(stdout,"%s\n", "main");

    #ifdef __EMSCRIPTEN__
    emscripten_exit_with_live_runtime();
    #endif

    #ifdef __FLASHPLAYER__
    AS3_GoAsync();
    #endif
}

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

AVCodecContext *init_codec(int input_sample_rate) {
    AVCodec *codec;
    AVCodecContext *codec_context;

    /** Get the AAC encoder */
    CHK_NULL(codec = avcodec_find_encoder(AV_CODEC_ID_AAC));

    /** Create a new codec context. */
    CHK_NULL(codec_context = avcodec_alloc_context3(codec));

    /** Check that codec can handle the input */
    CHK_NULL(check_sample_fmt(codec, input_sample_fmt));
    CHK_NULL(check_sample_rate(codec, input_sample_rate));

    output_sample_rate = input_sample_rate;

    /** Parameters for AAC */
    codec_context->sample_fmt     = input_sample_fmt;
    codec_context->sample_rate    = input_sample_rate;
    codec_context->channels       = output_channels;
    codec_context->channel_layout = av_get_default_channel_layout(output_channels);
    codec_context->bit_rate       = output_bit_rate;

    /** Open the Codec */
    CHK_ERROR(avcodec_open2(codec_context, codec, NULL));

    return codec_context;
}

AVFrame *init_input_frame(AVCodecContext *codec_context) {

    AVFrame *frame;

    /* Use the encoder's desired frame size for processing. */
    int frame_size = codec_context->frame_size;
    LOG1("frame_size",frame_size);

    CHK_NULL(frame = av_frame_alloc());

    frame->nb_samples     = codec_context->frame_size;
    frame->format         = codec_context->sample_fmt;
    frame->channel_layout = codec_context->channel_layout;

        /* the codec gives us the frame size, in samples,
         * we calculate the size of the samples buffer in bytes */
    CHK_ERROR(frame_size = av_samples_get_buffer_size(NULL,
        codec_context->channels,
        codec_context->frame_size,
        codec_context->sample_fmt, 0));

    CHK_NULL(input_frame_buffer = av_malloc(frame_size));

    /* setup the data pointers in the AVFrame */
    CHK_ERROR( avcodec_fill_audio_frame(frame,
        codec_context->channels,
        codec_context->sample_fmt,
        (const uint8_t*)input_frame_buffer,
        frame_size, 0));

    return frame;
}

int read_packet(void* ptr, uint8_t* buf, int buf_size) {
    fprintf(stdout,"read_packet(%lx %lx %d)\n",ptr,buf,buf_size);
    return buf_size;
}

int write_packet(void* ptr, uint8_t* buf, int buf_size) {
    fprintf(stdout,"write_packet(%lx %lx %d)\n",ptr,buf,buf_size);
    memcpy(output_buffer+output_buffer_pos,buf,buf_size);
    output_buffer_pos += buf_size;
    LOG1("  output_buffer_pos",output_buffer_pos);
    return buf_size;
}

int64_t seek(void* ptr, int64_t offset, int whence) {
   fprintf(stdout,"write_packet(%lx %ld %d)\n",ptr,offset,whence);
   return offset;
}

AVIOContext *init_io(AVCodecContext *codec_context) {
    CHK_NULL(input_frame   = init_input_frame(codec_context));

    /** Create the input FIFO buffer based on the Codec input format */
    CHK_NULL(fifo = av_audio_fifo_alloc(
        codec_context->sample_fmt,
        codec_context->channels, 1));

    output_buffer_length = 1000000;
    CHK_NULL( output_buffer = av_malloc(output_buffer_length));
    output_buffer_pos = 0;

    // Allocate the AVIOContext:
    // The fourth parameter (pStream) is a user parameter which will be passed to our callback functions
    AVIOContext *io;
    CHK_NULL(io = avio_alloc_context(output_buffer, output_buffer_length,  // internal Buffer and its size
                                             1,     // bWriteable (1=true,0=false)
                                             (void*)0x123,   // user data ; will be passed to our callback functions
                                             read_packet,
                                             write_packet,
                                             seek));
    return io;
}

AVFormatContext *init_output(int input_sample_rate, AVIOContext *io_context) {
    AVFormatContext *output_context;

    /** Create a new format context for the output container format. */
    CHK_NULL(output_context = avformat_alloc_context());

    /** Associate the output file (pointer) with the container format context. */
    output_context->pb = io_context;

    /** Set the container format to MP4 */
    CHK_NULL(output_context->oformat = av_guess_format("mp4", NULL, NULL));

    /**
     * Some container formats (like MP4) require global headers to be present
     * Mark the encoder so that it behaves accordingly.
     */
    if (output_context->oformat->flags & AVFMT_GLOBALHEADER)
        codec_context->flags |= AV_CODEC_FLAG_GLOBAL_HEADER;

    /** Create a new audio stream in the output file container. */
    AVStream *output_stream;
    CHK_NULL(output_stream = avformat_new_stream(output_context, codec_context->codec));

    output_stream->codec->sample_fmt     = codec_context->sample_fmt;
    output_stream->codec->sample_rate    = codec_context->sample_rate;
    output_stream->codec->channels       = codec_context->channels;
    output_stream->codec->channel_layout = codec_context->channel_layout;
    output_stream->codec->bit_rate       = codec_context->bit_rate;
    output_stream->codec->frame_size     = codec_context->frame_size;
    output_stream->codec->flags          = codec_context->flags;

    /** Set the sample rate for the container. */
    output_stream->time_base.den = output_stream->codec->sample_rate;
    output_stream->time_base.num = 1;

    CHK_ERROR(avformat_write_header(output_context, NULL));    /* Write the Header to the output Container */

    return output_context;
}



/**
    Set up input to accept samples PCM float 44.1k for now

    Create MP4 AAC output Container to be returned by flush()
*/
void init(const char *i_format, int i_sample_rate, const char *o_format, int o_sample_rate, int o_bit_rate) {
    AVIOContext *io_context;

    fprintf(stdout,"init(%s,%d,%s,%d,%d)\n",i_format,i_sample_rate,o_format,o_sample_rate,o_bit_rate);

    output_format = o_format;

    /** Register all codecs and formats so that they can be used. */
    av_register_all();

    CHK_NULL(codec_context = init_codec(i_sample_rate));

    CHK_NULL(io_context = init_io(codec_context));

    CHK_NULL(output_context = init_output(i_sample_rate, io_context))
}

/* check that a given sample format is supported by the encoder */
int check_sample_fmt(AVCodec *codec, enum AVSampleFormat sample_fmt)
{
    fprintf(stdout,"check_sample_fmt(%s)\n",av_get_sample_fmt_name(sample_fmt));
    const enum AVSampleFormat *p = codec->sample_fmts;
    while (*p != AV_SAMPLE_FMT_NONE) {
        fprintf(stdout," available %u %s\n",*p,av_get_sample_fmt_name(*p));

        if (*p == sample_fmt)
            return 1;
        p++;
    }
    return 0;
}

/* check that a given sample format is supported by the encoder */
int check_sample_rate(AVCodec *codec, int sample_rate)
{
    LOG1("check_sample_rate",sample_rate);
    const int *p = codec->supported_samplerates;
    while (*p != 0) {
        LOG1(" available",*p);

        if (*p == sample_rate)
            return 1;
        p++;
    }
    return 0;
}

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

    int frame_size = codec_context->frame_size;
    int input_samples_size = i_length / sizeof(float);
    int frame_samples_size = frame_size / sizeof(float);

  /**
    * Make the FIFO as large as it needs to be to hold both,
    * the old and the new samples.
    */
    LOG1("  before fifo space",av_audio_fifo_space(fifo));
    LOG1("    input_samples_size",input_samples_size);
    CHK_ERROR(av_audio_fifo_realloc(fifo, av_audio_fifo_size(fifo) + input_samples_size));
    LOG1("  after fifo space",av_audio_fifo_space(fifo));

    /** Store the new samples in the FIFO buffer. */
    LOG1("  before fifo size",av_audio_fifo_size(fifo));
    CHK_GE(av_audio_fifo_write(fifo, (void **)&i_data, input_samples_size), input_samples_size);
    LOG1("  after fifo size",av_audio_fifo_size(fifo));

    AVPacket *output_packet;
    CHK_NULL(output_packet=av_packet_alloc());
    CHK_VOID(av_init_packet(output_packet));
    /** Set the packet data and size so that it is recognized as being empty. */
    output_packet->data = NULL;
    output_packet->size = 0;
    output_packet->pts = 0;

    int finished               = 0;
    int amount_read            = 0;

    /**
     * While there is at least one Frame's worth of data in the Fifo,
     * encode the Frame and write it to the output Container
     */
    while (av_audio_fifo_size(fifo) >= frame_samples_size) {
        LOG1("  before fifo size",av_audio_fifo_size(fifo));
        CHK_ERROR( amount_read = av_audio_fifo_read(fifo,(void**)&input_frame_buffer,frame_samples_size));
        LOG1("  amount_read",amount_read);
        LOG1("  after fifo size",av_audio_fifo_size(fifo));

        int got_output = 0;
        CHK_ERROR(avcodec_encode_audio2(codec_context, output_packet, input_frame, &got_output));
        LOG1("  got_output",got_output);
        if(got_output) {
            CHK_ERROR(av_write_frame(output_context,output_packet));
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
        CHK_ERROR(avcodec_encode_audio2(codec_context, output_packet, NULL, &got_output));
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
    LOG1("get_output_sample_rate", output_sample_rate);
    return output_sample_rate;
}

char *get_output_format() {
    fprintf(stdout,"get_output_format (%s)\n", output_format);
    return output_format;
}

int get_output_length() {
    LOG1("get_output_length", output_buffer_pos);
    return output_buffer_pos;
}











