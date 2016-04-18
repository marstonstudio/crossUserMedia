/**
  * User: jon, peter
  * Date: 4/18/16
  * Time: 8:48 AM
  * Copyright English Central Inc. 2016
  */
  /*
    FFMpeg Primer

    In general a Foo is created with a FooContext

    Memory should be allocated/freed with av_malloc and av_free
    Free buffers first, then free the Context

    Files are Containers
    Containers are described with a Format Context
    Containers have one or more Streams
    Muxers separate/combine multiple Streams in a Container
    Streams are a sequence of Packets
    Packets contain one or more Frames of some Format
    Codecs input Frames of one Format, and output Frames of different Format
    Fifos buffer data so it can be read in Frame size chunks
    Resamplers convert on sample rate to another, created with a Resampler Context

    This API

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

char *input_format;
int input_sample_rate;
uint8_t *input_data;
int input_length;

char *output_format;
int output_sample_rate;
int output_bit_rate;
uint8_t *output_data;
int output_length;

// max of 30 seconds at 32k bits/sec
const int max_input_length = (32000 / 8) * 30;

// max of 30 seconds at 44100khz
const int max_output_length = 44100 * 4 * 30;

AVAudioFifo *input_fifo;

AVCodec *output_codec;
AVCodecContext *output_codec_context;
AVFormatContext *output_format_context;

SwrContext *resample_context

#define INTERNAL_ERROR 1

#define CHK_NULL(x) { fprintf(stdout,"%s\n",#x); if(!(x)) { fprintf(stderr,"%s FAILED",#x); return; }}
#define CHK_ERROR(x) { fprintf(stdout,"%s\n",#x); int err=(x); if(err!=0) { fprintf(stderr,"%s FAILED code=%d",#x,err); return; }}
#define CHK_POS(x) { fprintf(stdout,"%s\n",#x); int err=(x); if(err<0) { fprintf(stderr,"%s FAILED code=%d",#x,err); return; }}

int main(int argc, char **argv) {
    fprintf(stdout, "%s\n", "main");

    #ifdef __EMSCRIPTEN__
    emscripten_exit_with_live_runtime();
    #endif

    #ifdef __FLASHPLAYER__
    AS3_GoAsync();
    #endif
}

/**
    Initialize decoding

    Set up input to accept samples of i_format and i_sample rate
    only PCM double 44.1k is accepted for now

    Create MP4 AAC output Container to be returned by flush()
*/
void init(const char *i_format, int i_sample_rate, const char *o_format, int o_sample_rate, int o_bit_rate) {

    input_format = (char*)malloc(strlen(i_format) + 1);
    strcpy(input_format, i_format);
    input_sample_rate = i_sample_rate;

    output_format = (char*)malloc(strlen(o_format) + 1);
    strcpy(output_format, o_format);
    output_sample_rate = o_sample_rate;
    output_bit_rate = o_bit_rate;

    fprintf(stdout, "init (input_format:%s, input_sample_rate:%u, output_format:%s, output_sample_rate:%u, output_bit_rate:%u)\n",
               input_format, input_sample_rate, output_format, output_sample_rate, output_bit_rate);

    input_length = 0;
    input_data = (uint8_t*)malloc(max_input_length);

    output_length = 0;
    output_data = (uint8_t*)malloc(max_output_length);

    /** Register all codecs and formats so that they can be used. */
    av_register_all();

    /** Create a new format context for the output container format. */
    CHK_NULL(output_format_context = avformat_alloc_context());

    /** Get the AAC encoder */
    CHK_NULL(output_codec = avcodec_find_encoder(AV_CODEC_ID_AAC));

    /** Create a new codec context. */
    CHK_NULL(output_codec_context = avcodec_alloc_context3(output_codec));

    /**
     * Set the basic encoder parameters.
     * The input file's sample rate is used to avoid a sample rate conversion.
     */
    output_codec_context->channels       = 1;
    output_codec_context->channel_layout = av_get_default_channel_layout(1);
    output_codec_context->sample_rate    = output_sample_rate;
    output_codec_context->sample_fmt     = output_codec->sample_fmts[0];
    output_codec_context->bit_rate       = output_bit_rate;

    /** Create the FIFO buffer based on the specified output sample format. */
    CHK_NULL(input_fifo = av_audio_fifo_alloc(output_codec_context->sample_fmt, output_codec_context->channels, 1));

    /**
     * Create a resampler context for the conversion.
     * Set the conversion parameters.
     * Default channel layouts based on the number of channels
     * are assumed for simplicity (they are sometimes not detected
     * properly by the demuxer and/or decoder).
     */
    CHK_NULL(resample_context = swr_alloc_set_opts(NULL,
                                              av_get_default_channel_layout(output_codec_context->channels),
                                              output_codec_context->sample_fmt,
                                              output_codec_context->sample_rate,
                                              av_get_default_channel_layout(input_codec_context->channels),
                                              input_codec_context->sample_fmt,
                                              input_codec_context->sample_rate,
                                              0, NULL));

    /**
     * Perform a sanity check so that the number of converted samples is
     * not greater than the number of samples to be converted.
     * If the sample rates differ, this case has to be handled differently
     */
    av_assert0(output_codec_context->sample_rate == input_codec_context->sample_rate);

    /** Open the resampler with the specified parameters. */
    CHK_POS(swr_init(resample_context));
}

/**
    Load input samples

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
    fprintf(stdout, "load (i_length:%u)\n", i_length);


                    /**
                     * Encode the audio frame and store it in the temporary packet.
                     * The output audio stream encoder is used to do this.

                    if ((error = avcodec_encode_audio2(output_codec_context, &output_packet,
                                                       frame, data_present)) < 0) {
                        fprintf(stderr, "Could not encode frame (error '%s')\n", get_error_text(error));
                        av_packet_unref(&output_packet);
                        return error;
                    }
                    */
    //TODO: get asserts working
    //https://kripken.github.io/emscripten-site/docs/porting/Debugging.html
    //assert(input_length + output_length < max_output_length);
    /*
    memcpy(input_data + input_length, i_data, i_length);
    input_length += i_length;
    */
    memcpy(output_data + output_length, i_data, i_length);
    output_length += i_length;

    CHK_ERROR( add_samples_to_fifo(output_fifo,i_data,i_length) );

        /** Use the encoder's desired frame size for processing. */
        const int output_frame_size = output_codec_context->frame_size;
        int finished                = 0;

        /**
         * Make sure that there is one frame worth of samples in the FIFO
         * buffer so that the encoder can do its work.
         * Since the decoder's and the encoder's frame size may differ, we
         * need to FIFO buffer to store as many frames worth of input samples
         * that they make up at least one frame worth of output samples.
         */
        while (av_audio_fifo_size(fifo) < output_frame_size) {
            /**
             * Decode one frame worth of audio samples, convert it to the
             * output sample format and put it into the FIFO buffer.
             */
            if (read_decode_convert_and_store(fifo, input_format_context,
                                              input_codec_context,
                                              output_codec_context,
                                              resample_context, &finished))
                goto cleanup;

            /**
             * If we are at the end of the input file, we continue
             * encoding the remaining audio samples to the output file.
             */
            if (finished)
                break;
        }

        /**
         * If we have enough samples for the encoder, we encode them.
         * At the end of the file, we pass the remaining samples to
         * the encoder.
         */
        while (av_audio_fifo_size(fifo) >= output_frame_size ||
               (finished && av_audio_fifo_size(fifo) > 0))
            /**
             * Take one frame worth of audio samples from the FIFO buffer,
             * encode it and write it to the output file.
             */
            if (load_encode_and_write())
                goto cleanup;

        /**
         * If we are at the end of the input file and have encoded
         * all remaining samples, we can exit this loop and finish.
         */
        if (finished) {
            int data_written;
            /** Flush the encoder as it may have delayed frames. */
            do {
                if (encode_audio_frame(NULL, output_format_context, output_codec_context, &data_written))
                    goto cleanup;
            } while (data_written);
            break;
        }

}

/**
 * Load one audio frame from the FIFO buffer, encode and write it to the
 * output file.
 */
static int load_encode_and_write()
{
    /** Temporary storage of the output samples of the frame written to the file. */
    AVFrame *output_frame;
    /**
     * Use the maximum number of possible samples per frame.
     * If there is less than the maximum possible frame size in the FIFO
     * buffer use this number. Otherwise, use the maximum possible frame size
     */
    const int frame_size = FFMIN(av_audio_fifo_size(fifo), output_codec_context->frame_size);
    int data_written;

    /** Initialize temporary storage for one output frame. */
    if (init_output_frame(&output_frame, output_codec_context, frame_size))
        return AVERROR_EXIT;

    /**
     * Read as many samples from the FIFO buffer as required to fill the frame.
     * The samples are stored in the frame temporarily.
     */
    if (av_audio_fifo_read(fifo, (void **)output_frame->data, frame_size) < frame_size) {
        fprintf(stderr, "Could not read data from FIFO\n");
        av_frame_free(&output_frame);
        return AVERROR_EXIT;
    }

    /** Encode one frame worth of audio samples. */
    if (encode_audio_frame(output_frame, output_format_context,
                           output_codec_context, &data_written)) {
        av_frame_free(&output_frame);
        return AVERROR_EXIT;
    }
    av_frame_free(&output_frame);
    return 0;
}

int get_output_sample_rate() {
    fprintf(stdout, "get_output_sample_rate (%u)\n", output_sample_rate);
    return output_sample_rate;
}

char *get_output_format() {
    fprintf(stdout, "get_output_format (%s)\n", output_format);
    return output_format;
}

int get_output_length() {
    fprintf(stdout, "get_output_length (%u)\n", output_length);
    return output_length;
}

uint8_t *flush() {
    fprintf(stdout, "flush\n");
    return output_data;
}

void dispose(int status) {
    fprintf(stdout, "dispose (%d)\n", status);
    free(input_format);
    free(output_format);
    free(input_data);
    free(output_data);

    #ifdef __EMSCRIPTEN__
    emscripten_force_exit(status);
    #endif

    exit(status);
}

/**
 * Convert an error code into a text message.
 * @param error Error code to be converted
 * @return Corresponding error text (not thread-safe)
 */
static const char *get_error_text(const int error)
{
    static char error_buffer[255];
    av_strerror(error, error_buffer, sizeof(error_buffer));
    return error_buffer;
}





