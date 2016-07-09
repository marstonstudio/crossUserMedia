package com.marstonstudio.crossusermedia.encoder.events
{
    import flash.events.Event;
    import flash.utils.ByteArray;
    
    public final class EncoderEvent extends Event {

        public static const COMPLETE:String = "encoderComplete";
 
        private var _data:ByteArray;
    
        private var _format:String;
    
        private var _sampleRate:int;

        public function EncoderEvent(type:String, data:ByteArray=null, format:String=null, sampleRate:int=0, bubbles:Boolean = false, cancelable:Boolean = false) {
            super(type, bubbles, cancelable);
            _data = data;
            _format = format;
            _sampleRate = sampleRate;
        }

        public function get data():ByteArray {
            return _data;
        }

        public function get format():String {
            return _format;
        }

        public function get sampleRate():int {
            return _sampleRate;
        }

        public override function clone(): Event {
            return new EncoderEvent(type, _data, _format, _sampleRate, bubbles, cancelable);
        }
    }
}