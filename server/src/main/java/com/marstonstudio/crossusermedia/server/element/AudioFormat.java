package com.marstonstudio.crossusermedia.server.element;

import java.nio.ByteOrder;

public enum AudioFormat {

    WAV("wav", "wav"),
    MP3("mp3", "mp3"),
    MP4("mp4", "mp4"),
    PCM_F32_LE("f32le", "pcm"),
    PCM_F32_BE("f32be", "pcm");

    private final String name;
    private final String extension;

    AudioFormat(String name, String extension) {
        this.name = name;
        this.extension = extension;
    }

    public static AudioFormat fromString(String n) {
        if(n != null) {
            for(AudioFormat a : AudioFormat.values()) {
                if(n.equals(a.name)) return a;
            }
        }
        return null;
    }

    public static String toEnumeratedList() {
        String values = "";
        for(AudioFormat a : AudioFormat.values()) {
            values += a.name + ", ";
        }
        return values;
    }

    public String getName() {
        return name;
    }

    public String getExtension() {
        return extension;
    }

    public boolean isPCM() {
        return "pcm".equals(extension);
    }

    public ByteOrder getByteOrder() {
        if(this == PCM_F32_LE) {
            return ByteOrder.LITTLE_ENDIAN;
        } else if(this == PCM_F32_BE) {
            return ByteOrder.BIG_ENDIAN;
        } else {
            return null;
        }
    }

}