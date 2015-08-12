package com.marstonstudio.crossUserServer.encoder {

import flash.utils.ByteArray;

public class AbstractEncoder {

        private static const _channels:int = 1;     //Flash microphone only allows mono
        private static const _bitDepth:int = 16;    //Flash microphone only allows 16bit audio

        public function AbstractEncoder() {}

        /*
         * Flash microphone only allows mono
         */
        protected function get channels():int {
            return _channels;
        }

        /*
         * Flash microphone only allows 16bit audio
         */
        protected function get bitDepth():int {
            return _bitDepth;
        }

        protected function get sampleRate():int {
            throw new Error("get sampleRate() must be implemented in subclass");
        }

        public function get quality():int {
            throw new Error("get quality() must be implemented in subclass");
        }

        public function get framesPerPacket():int {
            throw new Error("get framesPerPacket() must be implemented in subclass");
        }

        public function get microphoneRate():uint {
            return sampleRate / 1000;
        }

        public function encode(samples:ByteArray):ByteArray {
            throw new Error("must be implemented in subclass");
        };

    }
}