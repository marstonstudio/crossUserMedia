package com.marstonstudio.crossUserServer.encoder {

import flash.utils.ByteArray;

public class PassThruEncoder extends AbstractEncoder {

        public function PassThruEncoder() {}

        override public function encode(samples:ByteArray):ByteArray {
            return samples;
        }

    }
}
