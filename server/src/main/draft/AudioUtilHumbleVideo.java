package com.marstonstudio.server.util;

import com.marstonstudio.server.util.FileUtil;
import io.humble.video.*;
import org.apache.log4j.Logger;
import io.humble.video.AudioFormat;

import java.io.File;
import java.io.IOException;


// read from demuxer, write to muxer
// https://github.com/artclarke/humble-video/blob/master/humble-video-test/src/test/java/io/humble/video_test/BeepSoundTest.java
// http://dl.beligum.com/Converter.java

public class AudioUtil {

    static private final Logger logger = Logger.getLogger(AudioUtil.class);

    static private final AudioChannel.Layout    AUDIO_CHANNEL_LAYOUT = AudioChannel.Layout.CH_LAYOUT_MONO;
    static private final int                    AUDIO_CHANNELS = 1;
    static private final int                    AUDIO_NUM_SAMPLES = 1024;       //server crashes at 4096!
    static private final int                    AUDIO_SAMPLE_RATE = 16000;
    static private final AudioFormat.Type       AUDIO_SAMPLE_FORMAT_TYPE = AudioFormat.Type.SAMPLE_FMT_S16;
    static private final Rational               AUDIO_TIMEBASE = Rational.make(1, AUDIO_SAMPLE_RATE);
    //static private final int                    OUTPUT_ENCODED_BPS = 32000;

    static private final int                    AUDIO_STREAM_INDEX = 0;

    /*
    public static File saveWavAudioToFile(byte[] audioBytes, File audioFile) throws IOException {

        AudioFormat inputFormat = new AudioFormat(16000, 16, 1, true, false);
        ByteArrayInputStream inputStream = new ByteArrayInputStream(audioBytes, 44, audioBytes.length);
        AudioInputStream audioInputStream = new AudioInputStream(inputStream, inputFormat, audioBytes.length / inputFormat.getFrameSize());

        AudioSystem.write(audioInputStream, AudioFileFormat.Type.WAVE, audioFile);
        return audioFile;
    }
    */

    public static File convertAudioFile(File inputFile, String outputFileType, boolean passThru) throws InterruptedException, IOException {

        File outputFile = FileUtil.prepareOutputFile(inputFile, outputFileType, passThru);
        if(passThru) {
            return FileUtil.copyFile(inputFile, outputFile);
        }

        final Demuxer inputDemuxer = openInputDemuxer(inputFile);
        final Decoder inputDecoder = openInputDecoder(inputDemuxer);

        final Muxer outputMuxer = Muxer.make(outputFile.getAbsolutePath(), null, null);
        final Encoder outputEncoder = openOutputEncoder(outputMuxer);
        outputMuxer.addNewStream(outputEncoder);
        outputMuxer.open(null, null);

        MediaAudio inputSamples = createSamples();
        MediaPacket inputPacket = createPacket();
        MediaPacket outputPacket = createPacket();

        while(inputDemuxer.read(inputPacket) >= 0) {
            //logger.info("TOP inputPacket " + inputPacket.toString());

            //if(inputPacket.isComplete() && inputPacket.getStreamIndex() == AUDIO_STREAM_INDEX) {
            if(inputPacket.getStreamIndex() == AUDIO_STREAM_INDEX) {
                int bytesOffset = 0;
                int bytesRead = 0;


                do {
                    //logger.info("BEFORE DECODE inputPacket.getSize():" + inputPacket.getSize() + ", bytesRead:" +bytesRead+", bytesOffset:"+bytesOffset);
                    bytesRead += inputDecoder.decodeAudio(inputSamples, inputPacket, bytesOffset);
                    bytesOffset += bytesRead;
                    //logger.info("AFTER DECODE inputPacket.getSize():" + inputPacket.getSize() + ", bytesRead:" +bytesRead+", bytesOffset:"+bytesOffset);


                    if(inputSamples.isComplete()) {
                        //logger.info("BEFORE ENCODE outputPacket " + outputPacket);
                        outputEncoder.encodeAudio(outputPacket, inputSamples);
                        //logger.info("AFTER ENCODE outputPacket " + outputPacket);
                    } else {
                        logger.warn("NOT inputSamples.isComplete()");
                    }
                    /*
                    outputEncoder.encodeAudio(outputPacket, inputSamples);
                    logger.info("DURING outputPacket.getSize():" + outputPacket.getSize());
                    if(outputPacket.isComplete()) {
                        boolean muxerComplete = false;
                        do {
                            muxerComplete = outputMuxer.write(outputPacket, false);
                        } while (!muxerComplete);
                    }
                    */


                } while (bytesOffset < inputPacket.getSize());

                //logger.info("BEFORE MUXER outputPacket " + outputPacket);
                outputMuxer.write(outputPacket, false);
                //logger.info("AFTER MUXER outputPacket " + outputPacket);
            }
        }

        flushDecoder(inputDecoder, inputSamples);
        inputDemuxer.close();

        flushEncoder(outputEncoder, outputPacket);
        logger.info("closing muxer");
        outputMuxer.close();
        logger.info("done");

        return outputFile;
    }

    private static Demuxer openInputDemuxer(File inputFile) throws IOException, InterruptedException {

        String inputName = inputFile.getAbsolutePath();
        Demuxer demuxer = Demuxer.make();
        demuxer.open(inputName, null, false, true, null, null);
        if(demuxer.getNumStreams() != 1) {
            throw new RuntimeException("Expected 1 stream, got " + demuxer.getNumStreams() + " in " + inputName);
        }

        if( demuxer.getStream(AUDIO_STREAM_INDEX) == null) {
            demuxer.close();
            throw new RuntimeException("no audioStream found for " + inputName);
        }

        if(demuxer.getStream(AUDIO_STREAM_INDEX).getDecoder() == null) {
            demuxer.close();
            throw new RuntimeException("no decoder found for " + inputName);
        }

        return demuxer;
    }

    private static Decoder openInputDecoder(Demuxer demuxer) throws IOException, InterruptedException {
        Decoder decoder = demuxer.getStream(AUDIO_STREAM_INDEX).getDecoder();
        decoder.setChannels(AUDIO_CHANNELS);
        decoder.setChannelLayout(AUDIO_CHANNEL_LAYOUT);
        decoder.open(null, null);
        logger.info("using decoder " + decoder.toString());

        return decoder;
    }

    private static MediaAudio createSamples() {
        return MediaAudio.make(
                AUDIO_NUM_SAMPLES,
                AUDIO_SAMPLE_RATE,
                AUDIO_CHANNELS,
                AUDIO_CHANNEL_LAYOUT,
                AUDIO_SAMPLE_FORMAT_TYPE
        );
    }

    private static MediaPacket createPacket() {
        return MediaPacket.make();
    }

    private static Encoder openOutputEncoder(Muxer muxer) {
        MuxerFormat outputFormat = muxer.getFormat();
        Codec outputCodec = Codec.findEncodingCodec(outputFormat.getDefaultAudioCodecId());

        Encoder encoder = Encoder.make(outputCodec);
        //encoder.setProperty("b", 32000); ??
        encoder.setChannelLayout(AUDIO_CHANNEL_LAYOUT);
        encoder.setChannels(AUDIO_CHANNELS);
        encoder.setSampleRate(AUDIO_SAMPLE_RATE);
        encoder.setSampleFormat(AUDIO_SAMPLE_FORMAT_TYPE);
        encoder.setTimeBase(AUDIO_TIMEBASE);
        logger.info("using encoder " + encoder.toString() + " codec " + outputCodec.toString());
        if (outputFormat.getFlag(MuxerFormat.Flag.GLOBAL_HEADER)) {
            encoder.setFlag(Coder.Flag.FLAG_GLOBAL_HEADER, true);
        }

        encoder.open(null, null);
        return encoder;
    }

    private static void flushDecoder(Decoder decoder, MediaAudio flushSamples) {
        logger.info("flushing decoder");
        do {
            decoder.decode(flushSamples, null, 0);
        } while (flushSamples.isComplete());
    }

    private static void flushEncoder(Encoder encoder, MediaPacket packet) {
        logger.info("flushing encoder");
        do {
            encoder.encodeAudio(packet, null);
        } while (packet.isComplete());
    }

    /*


     private MediaAudio beepSamples() {
    int sampleRate = 44100; // 44.1KHz
    int sampleNum  = 44100; // 44100 samples(1sec)
    int channel    = 2;     // 2channel(stereo)
    int tone       = 440;   // 440Hz tone.
    int bit        = 16;    // 16bit
    ByteBuffer buffer = ByteBuffer.allocate((int)sampleNum * bit * channel / 8);
    double rad = tone * 2 * Math.PI / sampleRate; // radian for each sample.
    double max = (1 << (bit - 2)) - 1; // ampletude
    buffer.order(ByteOrder.LITTLE_ENDIAN);
    for(int i = 0;i < sampleNum;i ++) {
      short data = (short)(Math.sin(rad * i) * max);
      for(int j = 0;j < channel;j ++) {
        buffer.putShort(data);
      }
    }
    buffer.flip();

    logger.info("data size for 1sec buffer.:" + buffer.remaining());
    MediaAudio samples = MediaAudio.make(sampleNum, sampleRate, channel, Layout.CH_LAYOUT_STEREO, Type.SAMPLE_FMT_S16);
    samples.getData(0).put(buffer.array(), 0, 0, buffer.remaining());
    logger.info("{}", samples.getDataPlaneSize(0)); // why this size is little bit bigger than original buffer?
    samples.setComplete(true);
    samples.setTimeBase(Rational.make(1, 44100));
    samples.setTimeStamp(0);
    samples.setNumSamples(sampleNum);
    return samples;
  }


        Buffer buffer = Buffer.make(null, inputBytes, 0, inputBytes.length);
        MediaAudio audio = MediaAudio.make(buffer, buffer.getBufferSize(), 16000, 1, AudioChannel.Layout.CH_LAYOUT_MONO, AudioFormat.Type.SAMPLE_FMT_S16);



        Muxer muxer = Muxer.make(getTempFileName(WAV_EXTENSION), WAV_FORMAT, null);

        Encoder encoder = Encoder.make(WAV_CODEC);
        MuxerFormat format = muxer.getFormat();
        if (format.getFlag(MuxerFormat.Flag.GLOBAL_HEADER))
            encoder.setFlag(Encoder.Flag.FLAG_GLOBAL_HEADER, true);
        encoder.setFlag(Encoder.Flag.FLAG_4MV)

        encoder.open(null, null);
        muxer.addNewStream(encoder);
        muxer.open(null, null);

        MediaPacket packet = MediaPacket.make();
        do {
            encoder.encodeAudio(packet, audio);
            if (packet.isComplete()) {
                muxer.write(packet, false);
            }
        } while (packet.isComplete());

        muxer.close();

        //File inputFile = saveFile(inputBytes);
        */
}
