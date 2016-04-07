package com.marstonstudio.crossusermedia.encoder {

    public class Encoder {

        import com.marstonstudio.crossusermedia.encoder.wrapper.init;
        
        public function Encoder() {}

        public function init(i_format:String, i_sample_rate:int, o_format:String, o_sample_rate:int, o_bit_rate:int):void {
            com.marstonstudio.crossusermedia.encoder.wrapper.init(i_format, i_sample_rate, o_format, o_sample_rate, o_bit_rate);
        }

    }

}