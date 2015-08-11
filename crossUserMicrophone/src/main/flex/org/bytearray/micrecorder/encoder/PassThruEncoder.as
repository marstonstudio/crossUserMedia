package org.bytearray.micrecorder.encoder {

    import flash.utils.ByteArray;

    public class PassThruEncoder implements IEncoder {

        public function PassThruEncoder() {}

        public function encode(samples:ByteArray):ByteArray {
            return samples;
        }

    }
}
