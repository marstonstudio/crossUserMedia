package com.marstonstudio.crossusermedia.microphone.events
{
import flash.events.Event;
import flash.utils.ByteArray;

public final class RecordingEvent extends Event {

        public static const RECORDING:String = "recording";

        public static const COMPLETE:String = "complete";
        
        private var _time:Number;

        private var _data:ByteArray;
    
        private var _format:String;
    
        private var _sampleRate:int;

        public function RecordingEvent(type:String, time:Number=NaN, data:ByteArray=null, format:String=null, sampleRate:int=0) {
            super(type, false, false);
            _time = time;
            _data = data;
            _format = format;
            _sampleRate = sampleRate;
        }
    
        public function get time():Number {
            return _time;
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
            return new RecordingEvent(type, _time, _data);
        }
    }
}