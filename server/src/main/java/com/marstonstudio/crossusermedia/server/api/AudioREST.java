// Copyright (c) 2014. EnglishCentral. All rights reserved.
package com.marstonstudio.crossusermedia.server.api;

import com.marstonstudio.crossusermedia.server.util.FileUtil;
import com.marstonstudio.crossusermedia.server.element.AudioSet;
import com.marstonstudio.crossusermedia.server.util.AudioUtil;
import org.apache.log4j.Logger;
import org.glassfish.jersey.media.multipart.FormDataParam;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.*;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

@Path("/audio")
public class AudioREST {

    protected static final Logger logger = Logger.getLogger(AudioREST.class);

    public static Set<String> ACCEPTED_AUDIO_FORMATS = new HashSet<String>(Arrays.asList("wav", "f32le", "f32be", "mp4"));

    @GET
    @Produces({MediaType.APPLICATION_JSON})
    public Response getCheck(
            @Context HttpServletRequest hsr
    ) {
        logger.info("GET /audio");
        return Response.ok().build();
    }

    @POST
    @Produces({MediaType.APPLICATION_JSON})
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public AudioSet postBlob(
            @Context HttpServletRequest hsr,
            @FormDataParam("payload") final InputStream payloadBlob,
            @FormDataParam("inputFormat") final String inputFormat,
            @FormDataParam("inputCodec") final String inputCodec,
            @FormDataParam("inputSampleRate") final Integer inputSampleRate,
            @FormDataParam("outputFormat") final String outputFormat
    ) throws IOException {
        logger.info("POST /audio");

        validateAudioType("inputFormat", inputFormat);
        validateAudioType("outputFormat", outputFormat);

        byte[] inputBytes = FileUtil.decodeBlob(payloadBlob);
        File inputFile = FileUtil.getNewEmptyFile(inputFormat);
        FileUtil.saveBytesToFile(inputBytes, inputFile);

        try {
            File outputFile = AudioUtil.convertAudioFile(inputFile, inputFormat, inputCodec, inputSampleRate, outputFormat);
            return new AudioSet(
                    FileUtil.getAudioUrlFromFile(hsr, inputFile),
                    FileUtil.getAudioUrlFromFile(hsr, outputFile)
            );
        } catch (Exception e) {
            logger.error("Encoding Problem", e);
            throw new WebApplicationException(e);
        }

    }

    private void validateAudioType(String paramName, String audioFormat) {

        if(audioFormat == null) {
            throw new WebApplicationException(paramName + " is required", Response.Status.METHOD_NOT_ALLOWED);
        }

        if(!ACCEPTED_AUDIO_FORMATS.contains(audioFormat)) {
            throw new WebApplicationException(paramName + " must be in " + ACCEPTED_AUDIO_FORMATS.toString(), Response.Status.NOT_ACCEPTABLE);
        }
    }

}
