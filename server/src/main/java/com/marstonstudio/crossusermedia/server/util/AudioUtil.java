package com.marstonstudio.crossusermedia.server.util;

import com.xuggle.mediatool.IMediaReader;
import com.xuggle.mediatool.IMediaWriter;
import com.xuggle.mediatool.MediaToolAdapter;
import com.xuggle.mediatool.ToolFactory;
import com.xuggle.mediatool.event.IAddStreamEvent;
import com.xuggle.xuggler.IError;
import com.xuggle.xuggler.IStreamCoder;
import org.apache.log4j.Logger;

import javax.xml.ws.WebServiceException;
import java.io.File;
import java.io.IOException;


// read from demuxer, write to muxer
// https://github.com/artclarke/humble-video/blob/master/humble-video-test/src/test/java/io/humble/video_test/BeepSoundTest.java
// http://dl.beligum.com/Converter.java

public class AudioUtil {

    static private final Logger logger = Logger.getLogger(AudioUtil.class);

    public static File convertAudioFile(File inputFile, String outputFileType, boolean passThru) throws InterruptedException, IOException {
        logger.info("inputFile: " + inputFile);

        File outputFile = FileUtil.prepareOutputFile(inputFile, outputFileType, passThru);
        if(passThru) {
            return FileUtil.copyFile(inputFile, outputFile);
        }

        ConverterTool converter = new ConverterTool();
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

    static class ConverterTool extends MediaToolAdapter {

        public ConverterTool() {}

        public void onAddStream(IAddStreamEvent event) {

            IStreamCoder streamCoder = event.getSource()
                    .getContainer()
                    .getStream(event.getStreamIndex())
                    .getStreamCoder();

            super.onAddStream(event);
        }
    }

}
