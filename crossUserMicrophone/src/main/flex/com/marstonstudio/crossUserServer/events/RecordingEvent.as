package com.marstonstudio.crossUserServer.events
{
import flash.events.Event;
import flash.utils.ByteArray;

public final class RecordingEvent extends Event {

        public static const RECORDING:String = "recording";

        public static const COMPLETE:String = "complete";
        
        private var _time:Number;

        private var _sampleRate:int;

        private var _data:ByteArray;

        public function RecordingEvent(type:String, time:Number, sampleRate:int, data:ByteArray) {
            super(type, false, false);
            _time = time;
            _sampleRate = sampleRate;
            _data = data;
        }

        public function get time():Number {
            return _time;
        }

        public function set time(value:Number):void {
            _time = value;
        }

        public function get sampleRate():int {
            return _sampleRate;
        }

        public function set sampleRate(value:int):void {
            _sampleRate = value;
        }

        public function get data():ByteArray {
            return _data;
        }

        public function set data(value:ByteArray):void {
            _data = value;
        }

        public override function clone(): Event {
            return new RecordingEvent(type, _time, _sampleRate, _data);
        }
    }
}