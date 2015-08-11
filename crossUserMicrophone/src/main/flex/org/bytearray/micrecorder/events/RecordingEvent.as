package org.bytearray.micrecorder.events
{
    import flash.events.Event;
    
    public final class RecordingEvent extends Event {

        public static const RECORDING:String = "recording";
        
        private var _time:Number;

        public function RecordingEvent(type:String, time:Number) {
            super(type, false, false);
            _time = time;
        }

        public function get time():Number {
            return _time;
        }

        public function set time(value:Number):void {
            _time = value;
        }

        public override function clone(): Event {
            return new RecordingEvent(type, _time)
        }
    }
}