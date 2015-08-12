package com.marstonstudio.crossUserServer.encoder {


import flash.utils.ByteArray;
import flash.utils.Endian;

public class SpeexEncoder extends AbstractEncoder{

        private var _bytes:ByteArray = new ByteArray();
        private var _buffer:ByteArray = new ByteArray();

        private static const _quality:int = 6;              //speex encoder supports 1-10
        private static const _framesPerPacket:int = 2;      //speex encoder supports different values
        private static const _sampleRate:int = 16000;       //speex encoder only supports 16khz

        public function SpeexEncoder() {}

        /*
         http://www.speex.org/docs/manual/speex-manual.pdf

         http://sourceforge.net/p/jspeex/code/HEAD/tree/main/trunk/codec/src/main/java/org/xiph/speex/OggSpeexWriter.java

         http://wwwimages.adobe.com/content/dam/Adobe/en/devnet/swf/pdf/swf-file-format-spec.pdf
         Speex compression

         Starting with SWF 10, a SWF file can store audio samples that have been compressed
         using the free, open source Speex voice codec (see speex.org).
         Speex audio is stored as format 11 in a DefineSound tag.
         While Speex supports a range of sample rates, Speex audio encoded in SWF is always encoded at 16 kHz;
         the SoundRate field of the DefineSound tag is disregarded.
         The SoundType and SoundSize fields are also ignored in the case of Speex.
         Speex in SWF is always mono and always decodes to 16-bit audio samples internally.
         Speex 1.2 beta 3 is compiled into the Flash Player as of version 10 (10.0.12).


         ========
         email from mchotin@adobe.com July 14, 2009

         Sampling rate is fixed 16 kHz. We may add a feature in Argo to decode 8 kHz, but for encoding, we will stick to 16 kHz

         Quality (variable)
         You can set through Microph0ne.encodeQuality
         http://help.adobe.com/en_US/FlashPlatform/reference/actionscript/3/flash/media/Microphone.html#encodeQuality

         Complexity is default (2)

         VBR is default (off)

         ABR is default (off)

         VAD is on. In argo, there will be a new property: Microphone.enableVAD, that you can turn off.

         DTX is off. You must set Microphone.setSilienceLevel(0, -1), but it is not related to speex.

         Perceptual enhancement is only for decoder, so I do not know why they are effected. It is on.

         Preprocessor: Noise suppression is -30 dB. AGC and VAD are off. Dereverb is on.
         In Argo, there will be a new property Microphone.noiseSupressionLevel, where you can turn denoise off.

         Acoustic Echo Canceller
         AEC – off. Microphone.useEchoSupression has nothing to do with speex and only reduces volume by 50%.

         Here are how encoder is initialized in the current Player:

         fSpeexState = speex_encoder_init(&speex_wb_mode);
         int one = 1;
         fSpeexQuality = 6; // default

         speex_encoder_ctl(fSpeexState, SPEEX_SET_QUALITY, &fSpeexQuality);
         int speexFrameSize, speexRate;
         speex_encoder_ctl(fSpeexState, SPEEX_GET_FRAME_SIZE, &speexFrameSize);
         speex_encoder_ctl(fSpeexState, SPEEX_GET_SAMPLING_RATE, &speexRate);
         speex_encoder_ctl(fSpeexState, SPEEX_SET_VAD, &one);
         fSpeexPreProcessState = speex_preprocess_state_init(speexFrameSize, speexRate);
         speex_preprocess_ctl(fSpeexPreProcessState, SPEEX_PREPROCESS_SET_DENOISE, &one);
         speex_preprocess_ctl(fSpeexPreProcessState, SPEEX_PREPROCESS_SET_DEREVERB, &one);

         int noiseGain = -30;
         speex_preprocess_ctl(fSpeexPreProcessState, SPEEX_PREPROCESS_SET_NOISE_SUPPRESS, &noiseGain);
         =================================
         */

        override public function encode(samples:ByteArray):ByteArray {
            var data:ByteArray = create( samples );
            
            _bytes.length = 0;
            _bytes.endian = Endian.LITTLE_ENDIAN;
            
            _bytes.writeUTFBytes("Speex   ");             //speex_string            char[]  8
            _bytes.writeUTFBytes("speex-1.2beta3      "); //speex_version           char[]  20
            _bytes.writeInt(1);                           //speex_version_id        int     4
            _bytes.writeInt(80);                          //header_size             int     4
            _bytes.writeInt(sampleRate);                  //rate                    int     4
            _bytes.writeInt(1);                           //mode                    int     4     (0=NB, 1=WB, 2=UWB)
            _bytes.writeInt(4);                           //mode_bitstream_version  int     4
            _bytes.writeInt(channels);                    //nb_channels             int     4
            _bytes.writeInt(bitrate);                     //bitrate                 int     4
            _bytes.writeInt(320);                         //frame_size              int     4     (NB=160, WB=320, UWB=640)
            _bytes.writeInt(0);                           //vbr                     int     4
            _bytes.writeInt(framesPerPacket);             //frames_per_packet       int     4
            _bytes.writeInt(0);                           //extra_headers           int     4
            _bytes.writeInt(0);                           //reserved1               int     4
            _bytes.writeInt(0);                           //reserved2               int     4
            _bytes.writeBytes( data );
            _bytes.position = 0;
            
            return _bytes;
        }
                
        private function create( bytes:ByteArray ):ByteArray
        {
            _buffer.endian = Endian.LITTLE_ENDIAN;
            _buffer.length = 0;
            bytes.position = 0;
            
            while( bytes.bytesAvailable ) {
                _buffer.writeFloat(bytes.readFloat());
            }
            return _buffer;
        }

        /**
         * Speex hard coded sample rate
         */
        override protected function get sampleRate():int {
            return _sampleRate;
        }

        override public function get quality():int {
            return _quality;
        }

        override public function get framesPerPacket():int {
            return _framesPerPacket;
        }

        /**
         * @see http://help.adobe.com/en_US/FlashPlatform/reference/actionscript/3/flash/media/Microphone.html#encodeQuality
         */
        private function get bitrate():int {

            switch(quality) {

                case 0 :
                    return 3950;
                    break;
                case 1 :
                    return 5750;
                    break;
                case 2 :
                    return 7750;
                    break;
                case 3 :
                    return 9800;
                    break;
                case 4 :
                    return 12800;
                    break;
                case 5 :
                    return 16800;
                    break;
                case 6 :
                    return 20600;
                    break;
                case 7 :
                    return 23800;
                    break;
                case 8 :
                    return 27800;
                    break;
                case 9 :
                    return 34200;
                    break;
                case 10 :
                    return 42200;
                    break;
            }
            throw new Error("Unsupported quality level " + quality);
        }
    }
}