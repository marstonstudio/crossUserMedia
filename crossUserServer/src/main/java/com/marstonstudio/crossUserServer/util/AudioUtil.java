package com.marstonstudio.crossUserServer.util;

import com.xuggle.mediatool.IMediaReader;
import com.xuggle.mediatool.IMediaWriter;
import com.xuggle.mediatool.MediaToolAdapter;
import com.xuggle.mediatool.ToolFactory;
import com.xuggle.mediatool.event.IAddStreamEvent;
import com.xuggle.xuggler.IError;
import com.xuggle.xuggler.IStreamCoder;
import org.apache.log4j.Logger;

import javax.sound.sampled.*;
import javax.xml.ws.WebServiceException;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;


// read from demuxer, write to muxer
// https://github.com/artclarke/humble-video/blob/master/humble-video-test/src/test/java/io/humble/video_test/BeepSoundTest.java
// http://dl.beligum.com/Converter.java

public class AudioUtil {

    static private final Logger logger = Logger.getLogger(AudioUtil.class);

    static private final int DEFAULT_SAMPLE_RATE = 16000;
    static private final int DEFAULT_CHANNEL_COUNT = 1;

    public static File saveWavAudioToFile(byte[] audioBytes, File audioFile) throws IOException {

        AudioFormat inputFormat = new AudioFormat(16000, 16, 1, true, false);
        ByteArrayInputStream inputStream = new ByteArrayInputStream(audioBytes, 44, audioBytes.length);
        AudioInputStream audioInputStream = new AudioInputStream(inputStream, inputFormat, audioBytes.length / inputFormat.getFrameSize());

        AudioSystem.write(audioInputStream, AudioFileFormat.Type.WAVE, audioFile);
        return audioFile;
    }

    public static File convertAudioFile(File inputFile, String outputFileType, boolean passThru) throws InterruptedException, IOException {
        logger.info("inputFile: " + inputFile);

        File outputFile = FileUtil.prepareOutputFile(inputFile, outputFileType, passThru);
        if(passThru) {
            return FileUtil.copyFile(inputFile, outputFile);
        }

        ConverterTool converter = initializeConverterTool(inputFile);
        IMediaReader reader = ToolFactory.makeReader(inputFile.getAbsolutePath());
        reader.addListener(converter);

        IMediaWriter writer = ToolFactory.makeWriter(outputFile.getAbsolutePath(), reader);
        converter.addListener(writer);

        IError error = reader.readPacket();
        while(error == null) {
            error = reader.readPacket();
        }

        //if an error was returned other than end of file, throw exception.  ERROR_IO seems to happen every time while still succesful?
        if( (error == null) || (error.getType() == IError.Type.ERROR_EOF)) {
            logger.info("encoded succesfully to outputFile: " + outputFile);
        } else {
            throw new WebServiceException(error.toString());
        }

        return outputFile;
    }

    static private ConverterTool initializeConverterTool(File inputFile) {
        try {
            AudioFileFormat audioFileFormat = AudioSystem.getAudioFileFormat(inputFile);
            AudioFormat audioFormat = audioFileFormat.getFormat();
            return new ConverterTool(Math.round(audioFormat.getSampleRate()), audioFormat.getChannels());
        } catch (UnsupportedAudioFileException | IOException e) {
            logger.warn(e);
            return new ConverterTool(DEFAULT_SAMPLE_RATE, DEFAULT_CHANNEL_COUNT);
        }
    }

    static class ConverterTool extends MediaToolAdapter {

        private int sampleRate;
        private int channelCount;

        public ConverterTool(int sampleRate, int channelCount) {
            this.sampleRate = sampleRate;
            this.channelCount = channelCount;
        }

        public void onAddStream(IAddStreamEvent event) {

            IStreamCoder streamCoder = event.getSource()
                    .getContainer()
                    .getStream(event.getStreamIndex())
                    .getStreamCoder();

            streamCoder.setChannels(channelCount);
            streamCoder.setSampleRate(sampleRate);

            super.onAddStream(event);
        }
    }

}
