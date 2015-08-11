package org.bytearray.micrecorder.encoder {

    import flash.utils.ByteArray;

    public interface IEncoder {
        function encode(samples:ByteArray):ByteArray;
    }
}