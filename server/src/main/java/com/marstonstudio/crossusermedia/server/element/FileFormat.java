package com.marstonstudio.crossusermedia.server.element;

import java.nio.ByteOrder;

public enum FileFormat {

    WAV("wav", "wav", "wav"),
    MP4("mp4", "mp4", "aac"),
    PCM_F32_LE("f32le", "pcm", "pcm"),
    PCM_F32_BE("f32be", "pcm", "pcm");

    private final String name;
    private final String extension;
    private final String codec;

    FileFormat(String name, String extension, String codec) {
        this.name = name;
        this.extension = extension;
        this.codec = codec;
    }

    public static FileFormat fromString(String n) {
        if(n != null) {
            for(FileFormat a : FileFormat.values()) {
                if(n.equals(a.name)) return a;
            }
        }
        return null;
    }

    public static String toEnumeratedList() {
        String values = "";
        for(FileFormat a : FileFormat.values()) {
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

    public boolean isPcm() {
        return "pcm".equals(extension);
    }

    public boolean isAac() {
        return "aac".equals(codec);
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