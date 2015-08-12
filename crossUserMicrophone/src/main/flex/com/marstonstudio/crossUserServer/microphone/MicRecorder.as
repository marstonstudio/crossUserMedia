package com.marstonstudio.crossUserServer.microphone {

import com.marstonstudio.crossUserServer.encoder.*;
import com.marstonstudio.crossUserServer.events.RecordingEvent;

import flash.events.EventDispatcher;
import flash.events.SampleDataEvent;
import flash.events.StatusEvent;
import flash.media.Microphone;
import flash.media.SoundCodec;
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
    [Event(name='recording', type='com.marstonstudio.crossUserServer.events.RecordingEvent')]
    
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
    [Event(name='complete', type='com.marstonstudio.crossUserServer.events.RecordingEvent')]

    /**
     * This tiny helper class allows you to quickly record the audio stream coming from the Microphone and save this as a physical file.
     * A WavEncoder is bundled to save the audio stream as a WAV file
     * @author Thibault Imbert - bytearray.org
     * @version 1.2
     */    
    public final class MicRecorder extends EventDispatcher {

        private const _silenceLevel:uint = 0;
        private const _timeOut:uint = 4000;
        private var   _gain:uint = 75;

        private var _difference:uint;
        private var _microphone:Microphone;
        private var _buffer:ByteArray = new ByteArray();
        private var _useSpeex:Boolean;
        private var _encoder:AbstractEncoder;

        public function MicRecorder(useSpeex:Boolean) {
            this._useSpeex = useSpeex;
        }

        /**
         * Starts recording from the default or specified microphone.
         * The first time the record() method is called the settings manager may pop-up to request access to the Microphone.
         */        
        public function record():void {
            if ( _microphone == null )
                _microphone = Microphone.getMicrophone();

            _difference = getTimer();

            if(_useSpeex) {
                _encoder = new SpeexEncoder();
                _microphone.codec = SoundCodec.SPEEX;
                _microphone.encodeQuality = _encoder.quality;
                _microphone.framesPerPacket = _encoder.framesPerPacket;
            } else {
                _encoder = new WavEncoder();
            }

            _microphone.setSilenceLevel(_silenceLevel, _timeOut);
            _microphone.rate = _encoder.microphoneRate;
            _microphone.gain = _gain;
            _buffer.length = 0;
            
            _microphone.addEventListener(SampleDataEvent.SAMPLE_DATA, onSampleData);
            _microphone.addEventListener(StatusEvent.STATUS, onStatus);
        }
        
        private function onStatus(event:StatusEvent):void {
            _difference = getTimer();
        }
        
        /**
         * Dispatched during the recording.
         * @param event
         */        
        private function onSampleData(event:SampleDataEvent):void {
            var time:Number = getTimer() - _difference;
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
            
            _buffer.position = 0;
            dispatchEvent( new RecordingEvent(RecordingEvent.COMPLETE, NaN, _encoder.encode(_buffer)) );
        }

        public function get gain():uint {
            return _gain;
        }

        public function set gain(value:uint):void {
            _gain = value;
            if(_microphone != null) _microphone.gain = _gain;
        }
    }
}