package com.marstonstudio.crossusermedia.microphone {

import com.marstonstudio.crossusermedia.encoder.Encoder;
import com.marstonstudio.crossusermedia.microphone.events.RecordingEvent;

import flash.display.Sprite;

import flash.events.EventDispatcher;
import flash.events.SampleDataEvent;
import flash.media.Microphone;
import flash.utils.ByteArray;
import flash.utils.getTimer;

    /**
     * Dispatched during the recording of the audio stream coming from the microphone.
     *
     * @eventType org.bytearray.micrecorder.RecordingEvent.RECORDING
     *
     * * @example
     * This example shows how to listen for such an event :
     * <div class="listing">
     * <pre>
     *
     * recorder.addEventListener ( RecordingEvent.RECORDING, onRecording );
     * </pre>
     * </div>
     */
    [Event(name='recording', type='com.marstonstudio.crossusermedia.microphone.events.RecordingEvent')]
    
    /**
     * Dispatched when the creation of the output file is done.
     *
     * @eventType flash.events.Event.COMPLETE
     *
     * @example
     * This example shows how to listen for such an event :
     * <div class="listing">
     * <pre>
     *
     * recorder.addEventListener ( Event.COMPLETE, onRecordComplete );
     * </pre>
     * </div>
     */
    [Event(name='complete', type='com.marstonstudio.crossusermedia.microphone.events.RecordingEvent')]

    /**
     * This tiny helper class allows you to quickly record the audio stream coming from the Microphone and save this as a physical file.
     * A WavEncoder is bundled to save the audio stream as a WAV file
     * @author Thibault Imbert - bytearray.org
     * @version 1.2
     */    
    public final class Recorder extends EventDispatcher {

        private const _silenceLevel:uint = 0;
        private const _timeOut:uint = 4000;
        private const _rateKHz:int = 16;
        private var   _gain:uint = 75;
        
        private var   _pcmFormat:String = "f32be";
        private var   _bitRate:int = 32000;


        private var _startTime:uint;
        private var _microphone:Microphone;
        private var _buffer:ByteArray;
        private var _encoder:Encoder;
        private var _rootSprite:Sprite;

        public function Recorder(rootSprite:Sprite) {
            this._rootSprite = rootSprite;
        }

        /**
         * Starts recording from the default or specified microphone.
         * The first time the record() method is called the settings manager may pop-up to request access to the Microphone.
         */        
        public function record():void {

            if ( _microphone == null ) {
                _microphone = Microphone.getMicrophone();
            }
            
            _startTime = getTimer();

            _microphone.setSilenceLevel(_silenceLevel, _timeOut);
            _microphone.rate = _rateKHz;
            _microphone.gain = _gain;
            _buffer = new ByteArray();
            
            _encoder = new Encoder(_rootSprite);
            //_encoder = new Encoder();
            _encoder.init(_pcmFormat, sampleRate, _pcmFormat, sampleRate, _bitRate);

            _microphone.addEventListener(SampleDataEvent.SAMPLE_DATA, onSampleData);
        }
        
        /**
         * Dispatched during the recording.
         * @param event
         */        
        private function onSampleData(event:SampleDataEvent):void {
            var time:Number = getTimer() - _startTime;
            dispatchEvent( new RecordingEvent(RecordingEvent.RECORDING, time, null) );
            
            while(event.data.bytesAvailable > 0) {
                _buffer.writeFloat(event.data.readFloat());
            }
        }
        
        /**
         * Stop recording the audio stream and automatically starts the packaging of the output file.
         */        
        public function stop():void {
            _microphone.removeEventListener(SampleDataEvent.SAMPLE_DATA, onSampleData);

            dispatchEvent( new RecordingEvent(RecordingEvent.COMPLETE, NaN, _buffer) );
        }

        public function get gain():uint {
            return _gain;
        }

        public function set gain(value:uint):void {
            _gain = value;
            if(_microphone != null) _microphone.gain = _gain;
        }

        public function get activityLevel():Number {
            if(_microphone != null) return _microphone.activityLevel;
            return 0;
        }

        public function get sampleRate():Number {
            if(_microphone != null) return _microphone.rate * 1000;
            return 0;
        }

        public function get format():String {
            return _pcmFormat;
        }
    }
}