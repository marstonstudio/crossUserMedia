package com.marstonstudio.crossusermedia.encoder.events
{
    import flash.events.Event;
    import flash.utils.ByteArray;
    
    public final class EncoderEvent extends Event {

        public static const COMPLETE:String = "encoderComplete";
 
        private var _data:ByteArray;
    
        private var _format:String;
        
        private var _codec:String;
    
        private var _sampleRate:int;

        private var _channels:int;

        public function EncoderEvent(type:String, data:ByteArray=null, format:String=null, codec:String=null, sampleRate:int=0, channels:int=0, bubbles:Boolean = false, cancelable:Boolean = false) {
            super(type, bubbles, cancelable);
            _data = data;
            _format = format;
            _codec = codec;
            _sampleRate = sampleRate;
            _channels = channels;
        }

        public function get data():ByteArray {
            return _data;
        }

        public function get format():String {
            return _format;
        }

        public function get codec():String {
            return _codec;
        }

        public function get sampleRate():int {
            return _sampleRate;
        }

        public function get channels():int {
            return _channels;
        }

        public override function clone(): Event {
            return new EncoderEvent(type, _data, _format, _codec, _sampleRate, _channels, bubbles, cancelable);
        }
    }
}