package com.marstonstudio.crossUserServer.element;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class AudioSet {

    private String inputUrl;

    @JsonProperty("inputUrl")
    public String getInputUrl() {
        return inputUrl;
    }

    private String outputUrl;

    @JsonProperty("outputUrl")
    public String getOutputUrl() {
        return outputUrl;
    }

    public AudioSet(String inputUrl, String outputUrl) {
        this.inputUrl = inputUrl;
        this.outputUrl = outputUrl;
    }
}
