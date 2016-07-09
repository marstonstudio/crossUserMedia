package com.marstonstudio.crossusermedia.microphone.events
{
    import flash.events.Event;

    public final class RecordingEvent extends Event {

        public static const SAMPLE_DATA:String = "recordingSampleData";

        private var _time:Number;

        public function RecordingEvent(type:String, time:Number=NaN, bubbles:Boolean = false, cancelable:Boolean = false) {
            super(type, bubbles, cancelable);
            _time = time;
        }
    
        public function get time():Number {
            return _time;
        }

        public override function clone(): Event {
            return new RecordingEvent(type, _time, bubbles, cancelable);
        }
    }
}