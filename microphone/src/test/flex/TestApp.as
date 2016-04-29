package {

import com.marstonstudio.crossusermedia.encoder.Encoder;

import flash.display.DisplayObjectContainer;
import flash.display.Sprite;

import flash.events.Event;
import flash.utils.ByteArray;
import flash.utils.getTimer;

import mx.core.ByteArrayAsset;
import mx.core.UIComponent;

import org.flexunit.asserts.assertNotNull;

import org.flexunit.asserts.assertTrue;
import org.flexunit.async.Async;
import org.fluint.uiImpersonation.UIImpersonator;

// ffmpeg -loglevel debug -f f32be -acodec pcm_f32be -ar 16000 -ac 1 -channel_layout mono -i audio.raw -b:a 32000 -f mp4 -acodec aac audio.mp4
// audio.raw = 276480 bytes, audio.mp4 = 18899 bytes

/*
 ffmpeg version 3.0 Copyright (c) 2000-2016 the FFmpeg developers
 built with Apple LLVM version 7.0.2 (clang-700.1.81)
 configuration: --prefix=/usr/local/Cellar/ffmpeg/3.0 --enable-shared --enable-pthreads --enable-gpl --enable-version3 --enable-hardcoded-tables --enable-avresample --cc=clang --host-cflags= --host-ldflags= --enable-opencl --enable-libx264 --enable-libmp3lame --enable-libxvid --enable-libfontconfig --enable-libfreetype --enable-libtheora --enable-libvorbis --enable-librtmp --enable-libopencore-amrnb --enable-libopencore-amrwb --enable-libass --enable-libspeex --enable-libfdk-aac --enable-libopus --enable-libx265 --enable-libdcadec --enable-nonfree --enable-vda
 libavutil      55. 17.103 / 55. 17.103
 libavcodec     57. 24.102 / 57. 24.102
 libavformat    57. 25.100 / 57. 25.100
 libavdevice    57.  0.101 / 57.  0.101
 libavfilter     6. 31.100 /  6. 31.100
 libavresample   3.  0.  0 /  3.  0.  0
 libswscale      4.  0.100 /  4.  0.100
 libswresample   2.  0.101 /  2.  0.101
 libpostproc    54.  0.100 / 54.  0.100
 Splitting the commandline.
 Reading option '-loglevel' ... matched as option 'loglevel' (set logging level) with argument 'debug'.
 Reading option '-f' ... matched as option 'f' (force format) with argument 'f32be'.
 Reading option '-acodec' ... matched as option 'acodec' (force audio codec ('copy' to copy stream)) with argument 'pcm_f32be'.
 Reading option '-ar' ... matched as option 'ar' (set audio sampling rate (in Hz)) with argument '16000'.
 Reading option '-ac' ... matched as option 'ac' (set number of audio channels) with argument '1'.
 Reading option '-channel_layout' ... matched as option 'channel_layout' (set channel layout) with argument 'mono'.
 Reading option '-i' ... matched as input file with argument 'audio.raw'.
 Reading option '-b:a' ... matched as option 'b' (video bitrate (please use -b:v)) with argument '32000'.
 Reading option '-f' ... matched as option 'f' (force format) with argument 'mp4'.
 Reading option '-acodec' ... matched as option 'acodec' (force audio codec ('copy' to copy stream)) with argument 'aac'.
 Reading option 'audio.mp4' ... matched as output file.
 Finished splitting the commandline.
 Parsing a group of options: global .
 Applying option loglevel (set logging level) with argument debug.
 Successfully parsed a group of options.
 Parsing a group of options: input file audio.raw.
 Applying option f (force format) with argument f32be.
 Applying option acodec (force audio codec ('copy' to copy stream)) with argument pcm_f32be.
 Applying option ar (set audio sampling rate (in Hz)) with argument 16000.
 Applying option ac (set number of audio channels) with argument 1.
 Applying option channel_layout (set channel layout) with argument mono.
 Successfully parsed a group of options.
 Opening an input file: audio.raw.
 [file @ 0x7f97b9d17360] Setting default whitelist 'file'
 [f32be @ 0x7f97ba00fa00] Before avformat_find_stream_info() pos: 0 bytes read:32768 seeks:0
 [f32be @ 0x7f97ba00fa00] All info found
 [f32be @ 0x7f97ba00fa00] Estimating duration from bitrate, this may be inaccurate
 [f32be @ 0x7f97ba00fa00] After avformat_find_stream_info() pos: 204800 bytes read:229376 seeks:0 frames:50
 Input #0, f32be, from 'audio.raw':
 Duration: 00:00:04.32, bitrate: 512 kb/s
 Stream #0:0, 50, 1/16000: Audio: pcm_f32be, 16000 Hz, mono, flt, 512 kb/s
 Successfully opened the file.
 Parsing a group of options: output file audio.mp4.
 Applying option b:a (video bitrate (please use -b:v)) with argument 32000.
 Applying option f (force format) with argument mp4.
 Applying option acodec (force audio codec ('copy' to copy stream)) with argument aac.
 Successfully parsed a group of options.
 Opening an output file: audio.mp4.
 [file @ 0x7f97b9d17dc0] Setting default whitelist 'file'
 Successfully opened the file.
 detected 8 logical cores
 [graph 0 input from stream 0:0 @ 0x7f97b9d1b640] Setting 'time_base' to value '1/16000'
 [graph 0 input from stream 0:0 @ 0x7f97b9d1b640] Setting 'sample_rate' to value '16000'
 [graph 0 input from stream 0:0 @ 0x7f97b9d1b640] Setting 'sample_fmt' to value 'flt'
 [graph 0 input from stream 0:0 @ 0x7f97b9d1b640] Setting 'channel_layout' to value '0x4'
 [graph 0 input from stream 0:0 @ 0x7f97b9d1b640] tb:1/16000 samplefmt:flt samplerate:16000 chlayout:0x4
 [audio format for output stream 0:0 @ 0x7f97b9d1bb20] Setting 'sample_fmts' to value 'fltp'
 [audio format for output stream 0:0 @ 0x7f97b9d1bb20] Setting 'sample_rates' to value '96000|88200|64000|48000|44100|32000|24000|22050|16000|12000|11025|8000|7350'
 [audio format for output stream 0:0 @ 0x7f97b9d1bb20] auto-inserting filter 'auto-inserted resampler 0' between the filter 'Parsed_anull_0' and the filter 'audio format for output stream 0:0'
 [AVFilterGraph @ 0x7f97b9d16f40] query_formats: 4 queried, 6 merged, 3 already done, 0 delayed
 [auto-inserted resampler 0 @ 0x7f97b9d1c260] [SWR @ 0x7f97ba05fc00] Using fltp internally between filters
 [auto-inserted resampler 0 @ 0x7f97b9d1c260] ch:1 chl:mono fmt:flt r:16000Hz -> ch:1 chl:mono fmt:fltp r:16000Hz
 Output #0, mp4, to 'audio.mp4':
 Metadata:
 encoder         : Lavf57.25.100
 Stream #0:0, 0, 1/16000: Audio: aac (LC) ([64][0][0][0] / 0x0040), 16000 Hz, mono, fltp, 32 kb/s
 Metadata:
 encoder         : Lavc57.24.102 aac
 Stream mapping:
 Stream #0:0 -> #0:0 (pcm_f32be (native) -> aac (native))
 Press [q] to stop, [?] for help
 cur_dts is invalid (this is harmless if it occurs once at the start per stream)
 Last message repeated 1 times
 [output stream 0:0 @ 0x7f97b9d1b960] EOF on sink link output stream 0:0:default.
 No more output streams to write to, finishing.
 [aac @ 0x7f97ba057000] Trying to remove 512 more samples than there are in the queue
 size=      18kB time=00:00:04.35 bitrate=  34.7kbits/s speed=64.1x
 video:0kB audio:17kB subtitle:0kB other streams:0kB global headers:0kB muxing overhead: 5.758254%
 Input file #0 (audio.raw):
 Input stream #0:0 (audio): 68 packets read (276480 bytes); 68 frames decoded (69120 samples);
 Total: 68 packets (276480 bytes) demuxed
 Output file #0 (audio.mp4):
 Output stream #0:0 (audio): 68 frames encoded (69120 samples); 69 packets muxed (17870 bytes);
 Total: 69 packets (17870 bytes) muxed
 68 frames successfully decoded, 0 decoding errors
 [AVIOContext @ 0x7f97b9d1b260] Statistics: 30 seeks, 92 writeouts
 [aac @ 0x7f97ba057000] Qavg: 107.061
 [AVIOContext @ 0x7f97b9d17400] Statistics: 276480 bytes read, 0 seeks
 */

public class TestApp {

        public function TestApp() {}

        [Embed(source="../resources/audio.raw",mimeType="application/octet-stream")]
        public var AudioPcm:Class;
    
        public var container:DisplayObjectContainer;

        [Before(async,ui)]
        public function initialize():void {
            trace("+++++++++++++++++++++++++++++++++++++++++++++++++++++++");
            trace("test::start " + new Date().toLocaleString());
            trace("");
            container = new UIComponent();
            Async.proceedOnEvent(this, container, Event.ADDED_TO_STAGE, 100);
            UIImpersonator.addChild(container);
        }

        [Test(description="Load audio asset")]
        public function testAudioLoad():void {

            var audioPcmAsset:ByteArrayAsset = new AudioPcm();
            var inputBytesAvailable:int = audioPcmAsset.bytesAvailable;
            assertTrue("embedded bytesAvailable", inputBytesAvailable > 0);

            assertNotNull(container.stage);
            var rootSprite:Sprite = new Sprite();
            container.addChild(rootSprite);

            const inputCodec:String = 'pcm_f32be';
            const inputSampleRate:int = 16000;
            const inputChannels:int = 1;
            const outputCodec:String = 'aac';
            const outputFormat:String = 'mp4';
            const outputSampleRate:int = 16000;
            const outputChannels:int = 1;
            const outputBitRate:int = 32000;

            var encoder:Encoder = new Encoder(rootSprite);
            encoder.init(inputCodec, inputSampleRate, inputChannels, outputCodec, outputFormat, outputSampleRate, outputChannels, outputBitRate);
            encoder.load(audioPcmAsset);
            var output:ByteArray = encoder.flush();
            var outputBytesAvailable:int = output.bytesAvailable;

            var encoderOutputFormat:String = encoder.getOutputFormat();
            var encoderOutputSampleRate:int = encoder.getOutputSampleRate();
            var encoderOutputLength:int = encoder.getOutputLength();
            var compressionRatio:Number = Math.round(1000 * outputBytesAvailable / inputBytesAvailable) / 10;

            trace("+++++++++++++++++++++++++++++++++++++++++++++++++++++++");
            trace("inputBytesAvailable = " + inputBytesAvailable);
            trace("outputBytesAvailable = " + outputBytesAvailable);
            trace("expected output filesize 6.8% of input, actual filesize:" + compressionRatio + "%");
            trace("encoder.getOutputFormat() = " + encoderOutputFormat);
            trace("encoder.getOutputSampleRate() = " + encoderOutputSampleRate);
            trace("encoder.getOutputLength() = " + encoderOutputLength);
            trace("+++++++++++++++++++++++++++++++++++++++++++++++++++++++");
            sleep(1000);

            assertTrue("outputFormat set to " + outputFormat, encoderOutputFormat == outputFormat);
            assertTrue("outputSampleRate set to " + outputSampleRate, encoderOutputSampleRate == outputSampleRate);
            assertTrue("encoder.getOutputLength() > 0", encoderOutputLength > 0);
            assertTrue("outputBytesAvailable > 0", outputBytesAvailable > 0);
            assertTrue("outputBytesAvailable = encoder.getOutputLength()", outputBytesAvailable == encoderOutputLength);
            assertTrue("outputBytesAvailable * 10 < inputBytesAvailable", outputBytesAvailable * 10 < inputBytesAvailable);
            assertTrue("outputBytesAvailable * 20 > inputBytesAvailable", outputBytesAvailable * 20 > inputBytesAvailable);

            encoder.dispose(0);
        }
    
        [After(ui)]
        public function finalize():void {
            UIImpersonator.removeAllChildren();
            container = null;

            trace("");
            trace("test::complete " + new Date().toLocaleString());
            trace("=======================================================");
            sleep(1000);
        }

        private function sleep(ms:int):void {
            var init:int = getTimer();
            while(true) {
                if(getTimer() - init >= ms) {
                    break;
                }
            }
        }

    }
}
