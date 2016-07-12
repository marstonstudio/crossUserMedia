package com.marstonstudio.crossusermedia.server.element;

import java.nio.ByteOrder;

public enum FileFormat {

    WAV("wav"),
    MP4("mp4"),
    PCM_F32_LE("f32le"),
    PCM_F32_BE("f32be");

    private final String name;

    FileFormat(String name) {
        this.name = name;
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
        if(isPcm()) {
            return "pcm";
        }
        return this.getName();
    }

    public boolean isPcm() {
        return (this == PCM_F32_BE || this == PCM_F32_LE);
    }

    public boolean isAac() {
        return (this == MP4);
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