package com.marstonstudio.crossUserServer.events
{
import flash.events.Event;
import flash.utils.ByteArray;

public final class RecordingEvent extends Event {

        public static const RECORDING:String = "recording";

        public static const COMPLETE:String = "complete";
        
        private var _time:Number;

        private var _data:ByteArray;

        public function RecordingEvent(type:String, time:Number, data:ByteArray) {
            super(type, false, false);
            _time = time;
            _data = data;
        }

        public function get time():Number {
            return _time;
        }

        public function set time(value:Number):void {
            _time = value;
        }

        public function get data():ByteArray {
            return _data;
        }

        public function set data(value:ByteArray):void {
            _data = value;
        }

        public override function clone(): Event {
            return new RecordingEvent(type, _time, _data);
        }
    }
}