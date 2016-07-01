package com.marstonstudio.crossusermedia.server.util;

import org.apache.log4j.Logger;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.WebApplicationException;
import java.io.*;
import java.nio.file.Files;
import java.text.SimpleDateFormat;
import java.util.Date;

public class FileUtil {

    private static final Logger logger = Logger.getLogger(FileUtil.class);

    static private final SimpleDateFormat FILENAME_FORMAT = new SimpleDateFormat("yyyyMMddHHmmss");

    static private final String AUDIO_DIRECTORY = "audio";

    private static String _audioFilePath;

    public static void startup(ServletContext servletContext) {
        _audioFilePath = servletContext.getRealPath( File.separator + AUDIO_DIRECTORY);
    }

    static public File getNewEmptyFile(String fileType) {
        String name = FILENAME_FORMAT.format(new Date()) + "." + fileType;
        return new File(_audioFilePath + File.separator + name);
    }

    public static String getAudioUrlFromFile(HttpServletRequest hsr, File file) {
        StringBuffer url = new StringBuffer();
        url.append(hsr.getScheme()).append("://");
        url.append(hsr.getServerName());
        url.append(":").append(hsr.getServerPort());
        url.append(hsr.getContextPath());
        url.append("/" + AUDIO_DIRECTORY);
        url.append("/" + file.getName());

        return url.toString();
    }

    public static void copyFile(File inputFile, File outputFile) {
        try {
            Files.copy(inputFile.toPath(), outputFile.toPath());
        }catch(IOException e) {
            logger.error(e);
            throw new WebApplicationException(e);
        }
    }

    public static String getFileExtension(File file) {
        String fileName = file.getName();
        String extension = "";

        int i = fileName.lastIndexOf('.');
        int p = Math.max(fileName.lastIndexOf('/'), fileName.lastIndexOf('\\'));

        if (i > p) {
            extension = fileName.substring(i+1);
        }

        return extension;
    }

    public static File createOutputFile(File inputFile, String outputFileType, boolean passThru) {
        String inputName = inputFile.getAbsolutePath();
        String outputName = inputName.substring(0, inputName.lastIndexOf('.')) + (passThru ? "_pasthru." : ".") + outputFileType;
        return new File(outputName);
    }

    public static void saveBytesToFile(File inputFile, byte[] header, byte[] payload) {
        try {
            FileOutputStream fileStream = new FileOutputStream(inputFile);
            if(header != null) {
                fileStream.write(header);
            }
            fileStream.write(payload);
            fileStream.close();
        } catch (Exception e) {
            logger.error(e);
            throw new WebApplicationException(e);
        }
    }

    public static void saveBytesToFile(File inputFile, byte[] payload) {
        saveBytesToFile(inputFile, null, payload);
    }

    public static byte[] getBytesFromFile(File inputFile) {
        try {
            FileInputStream fileStream = new FileInputStream(inputFile);
            byte[] fileContent = new byte[(int) inputFile.length()];
            fileStream.read(fileContent);
            fileStream.close();
            return  fileContent;
        } catch (Exception e) {
            logger.error(e);
            throw new WebApplicationException(e);
        }
    }

    public static byte[] decodeBlob(InputStream blob) {

        ByteArrayOutputStream buffer = new ByteArrayOutputStream();

        int nRead;
        byte[] data = new byte[16384];

        try {
            while ((nRead = blob.read(data, 0, data.length)) != -1) {
                buffer.write(data, 0, nRead);
            }
            buffer.flush();
        } catch (IOException e) {
            logger.error(e);
            throw new WebApplicationException(e.getCause() + " " + e.getMessage(), e);
        }

        return buffer.toByteArray();
    }


}
