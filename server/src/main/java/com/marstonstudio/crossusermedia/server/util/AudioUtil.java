package com.marstonstudio.crossusermedia.server.util;

import com.marstonstudio.crossusermedia.server.element.FileFormat;
import net.sourceforge.jaad.aac.AACException;
import net.sourceforge.jaad.aac.Decoder;
import net.sourceforge.jaad.aac.SampleBuffer;
import net.sourceforge.jaad.mp4.MP4Container;
import net.sourceforge.jaad.mp4.api.AudioTrack;
import net.sourceforge.jaad.mp4.api.Frame;
import net.sourceforge.jaad.mp4.api.Movie;
import net.sourceforge.jaad.mp4.api.Track;
import net.sourceforge.jaad.util.wav.WaveFileWriter;
import org.apache.log4j.Logger;

import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response;
import javax.xml.ws.WebServiceException;
import java.io.File;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.FloatBuffer;
import java.util.List;

public class AudioUtil {

    static private final Logger logger = Logger.getLogger(AudioUtil.class);

    public static File convertAudioFile(File inputFile, FileFormat inputFormat, Integer inputSampleRate, FileFormat outputFormat) throws InterruptedException, IOException {
        logger.info("inputFile: " + inputFile + ", inputFormat:" + inputFormat + ", inputSampleRate:" + inputSampleRate + ", outputFormat:" + outputFormat);

        if(inputFormat == outputFormat) {
            File outputFile = FileUtil.createOutputFile(inputFile, outputFormat.getExtension(), true);
            FileUtil.copyFile(inputFile, outputFile);
            return outputFile;
        }

        if(inputFormat.isPcm()) {
            return convertPcmToWav(inputFile, inputFormat, inputSampleRate);
        }

        if(inputFormat.isAac() && outputFormat.equals(FileFormat.WAV)) {
            return inputFile;
            //return convertAacToWav(inputFile);
        }

        throw new WebServiceException("Cannot convert " + inputFormat + " to " + outputFormat);
    }

    //http://stackoverflow.com/questions/4440015/java-pcm-to-wav
    public static File convertPcmToWav(File pcmFile, FileFormat inputFormat, Integer inputSampleRate) throws IOException {

        if(inputSampleRate == null) {
            throw new WebApplicationException("inputSampleRate is required for format type: " + inputFormat.getName(), Response.Status.METHOD_NOT_ALLOWED);
        }

        byte[] float32PcmData = FileUtil.getBytesFromFile(pcmFile);
        byte[] int16PcmData = convertFloat32ToInt16Pcm(float32PcmData, inputFormat);

        File wavFile = FileUtil.createOutputFile(pcmFile, FileFormat.WAV.getExtension(), false);
        writeWavFile(wavFile, int16PcmData, inputSampleRate, 1, 16);
        return wavFile;

        /*
        File wavFile = FileUtil.createOutputFile(pcmFile, FileFormat.WAV.getExtension(), false);
        WaveFileWriter wavWriter = new WaveFileWriter(wavFile, inputSampleRate, 1, 16);
        wavWriter.write(int16PcmData);
        wavWriter.close();

        return wavFile;
        */
    }

    public static byte[] convertFloat32ToInt16Pcm(byte[] float32PcmData, FileFormat inputFormat) {
        logger.info("convertFloat32ToInt16Pcm format:" + inputFormat.getName() +", byteOrder:" + inputFormat.getByteOrder());

        FloatBuffer float32Buffer = ByteBuffer.wrap(float32PcmData).order(inputFormat.getByteOrder()).asFloatBuffer();
        float32Buffer.rewind();
        int l = float32Buffer.remaining();

        ByteBuffer byteBuffer = ByteBuffer.allocate(l*2).order(ByteOrder.LITTLE_ENDIAN);

        while(float32Buffer.hasRemaining()) {
            float sample = float32Buffer.get() * Short.MAX_VALUE;
            if(sample > Short.MAX_VALUE) sample = Short.MAX_VALUE;
            if(sample < Short.MIN_VALUE) sample = Short.MIN_VALUE;
            byteBuffer.putShort((short) sample);
        }

        return byteBuffer.array();
    }

    // http://jaadec.sourceforge.net/index.php
    // https://github.com/DV8FromTheWorld/JAADec
    // http://www.programcreek.com/java-api-examples/index.php?api=net.sourceforge.jaad.aac.Decoder
    public static File convertAacToWav(File mp4File) throws IOException {

        RandomAccessFile randomAccessFile = new RandomAccessFile(mp4File, "r");
        final MP4Container cont = new MP4Container(randomAccessFile);
        final Movie movie = cont.getMovie();
        final List<Track> tracks = movie.getTracks(AudioTrack.AudioCodec.AAC);
        if (tracks.isEmpty()) {
            throw new WebApplicationException("Movie does not contain any AAC track", Response.Status.METHOD_NOT_ALLOWED);
        }

        final AudioTrack track = (AudioTrack) tracks.get(0);
        final Decoder decoder = new Decoder(track.getDecoderSpecificInfo());
        int sampleRate = decoder.getConfig().getSampleFrequency().getFrequency();
        int channels = decoder.getConfig().getChannelConfiguration().getChannelCount();
        int sampleSize = track.getSampleSize();

        File wavFile = FileUtil.createOutputFile(mp4File, FileFormat.WAV.getExtension(), false);
        WaveFileWriter wavWriter = new WaveFileWriter(wavFile, sampleRate, channels, sampleSize);

        final SampleBuffer buffer = new SampleBuffer();
        while (track.hasMoreFrames()) {
            Frame frame = track.readNextFrame();
            try {
                decoder.decodeFrame(frame.getData(), buffer);
                wavWriter.write(buffer.getData());
            } catch (AACException e) {
                logger.error(e);
            }
        }

        wavWriter.close();
        return wavFile;
    }

    public static void writeWavFile(File wavFile, byte[] int16PcmData, int sampleRate, int channels, int sampleSize) {

        long totalDataLen = int16PcmData.length + 36;
        long bitrate = sampleRate * channels * sampleSize;

        byte[] header = new byte[44];
        header[0] = 'R';
        header[1] = 'I';
        header[2] = 'F';
        header[3] = 'F';
        header[4] = (byte) (totalDataLen & 0xff);
        header[5] = (byte) ((totalDataLen >> 8) & 0xff);
        header[6] = (byte) ((totalDataLen >> 16) & 0xff);
        header[7] = (byte) ((totalDataLen >> 24) & 0xff);
        header[8] = 'W';
        header[9] = 'A';
        header[10] = 'V';
        header[11] = 'E';
        header[12] = 'f';
        header[13] = 'm';
        header[14] = 't';
        header[15] = ' ';
        header[16] = (byte) sampleSize;
        header[17] = 0;
        header[18] = 0;
        header[19] = 0;
        header[20] = 1;
        header[21] = 0;
        header[22] = (byte) channels;
        header[23] = 0;
        header[24] = (byte) (sampleRate & 0xff);
        header[25] = (byte) ((sampleRate >> 8) & 0xff);
        header[26] = (byte) ((sampleRate >> 16) & 0xff);
        header[27] = (byte) ((sampleRate >> 24) & 0xff);
        header[28] = (byte) ((bitrate / 8) & 0xff);
        header[29] = (byte) (((bitrate / 8) >> 8) & 0xff);
        header[30] = (byte) (((bitrate / 8) >> 16) & 0xff);
        header[31] = (byte) (((bitrate / 8) >> 24) & 0xff);
        header[32] = (byte) ((channels * sampleSize) / 8);
        header[33] = 0;
        header[34] = 16;
        header[35] = 0;
        header[36] = 'd';
        header[37] = 'a';
        header[38] = 't';
        header[39] = 'a';
        header[40] = (byte) (int16PcmData.length  & 0xff);
        header[41] = (byte) ((int16PcmData.length >> 8) & 0xff);
        header[42] = (byte) ((int16PcmData.length >> 16) & 0xff);
        header[43] = (byte) ((int16PcmData.length >> 24) & 0xff);

        FileUtil.saveBytesToFile(wavFile, header, int16PcmData);
    }
}