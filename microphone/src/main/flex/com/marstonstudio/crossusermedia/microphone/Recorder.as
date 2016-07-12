package com.marstonstudio.crossusermedia.microphone {

import com.marstonstudio.crossusermedia.encoder.Encoder;
import com.marstonstudio.crossusermedia.microphone.events.RecordingEvent;

import flash.display.Sprite;

import flash.events.EventDispatcher;
import flash.events.SampleDataEvent;
import flash.media.Microphone;
import flash.system.System;
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
        private const _channels:int = 1;
        private var   _gain:uint = 75;

        private const _pcmFormat:String = "f32be";
        private const _pcmCodec:String = "pcm_f32be";

        private const _outputBitRate:int = 32000;
        private const _maxSeconds:int = 30;

        private const _defaultOutputFormat:String = "mp4";
        private const _defaultOutputCodec:String = "aac";
        
        private var _startTime:uint;
        private var _microphone:Microphone;
        private var _encoder:Encoder;
        private var _rootSprite:Sprite;

        public function Recorder(rootSprite:Sprite) {
            this._rootSprite = rootSprite;
        }

        /**
         * Starts recording from the default or specified microphone.
         * The first time the record() method is called the settings manager may pop-up to request access to the Microphone.
         */        
        public function record(passthru:Boolean = false):void {
            
            var outputFormat:String = passthru ? _pcmFormat : _defaultOutputFormat;
            var outputCodec:String = passthru ? _pcmCodec : _defaultOutputCodec;

            if ( _microphone == null ) {
                _microphone = Microphone.getMicrophone();
            }
            
            _startTime = getTimer();

            _microphone.setSilenceLevel(_silenceLevel, _timeOut);
            _microphone.rate = _rateKHz;
            _microphone.gain = _gain;
            
            _encoder = new Encoder(_rootSprite);
            _encoder.init(  _pcmFormat, _pcmCodec, sampleRate, _channels, 
                            outputFormat, outputCodec, sampleRate, _channels, 
                            _outputBitRate, _maxSeconds);

            _microphone.addEventListener(SampleDataEvent.SAMPLE_DATA, onSampleData);
        }
        
        /**
         * Dispatched during the recording.
         * @param event
         */        
        private function onSampleData(event:SampleDataEvent):void {
            var time:Number = getTimer() - _startTime;
            dispatchEvent( new RecordingEvent(RecordingEvent.SAMPLE_DATA, time) );
            
            if(_encoder != null) _encoder.load(event.data);
        }
        
        /**
         * Stop recording the audio stream and automatically starts the packaging of the output file.
         */        
        public function stop():void {
            _microphone.removeEventListener(SampleDataEvent.SAMPLE_DATA, onSampleData);
            _encoder.load();
            //_rootSprite must have a listener for EncoderEvent.COMPLETE
        }
        
        public function dispose():void {
            _encoder.dispose(0);
            _encoder = null;
            //System.pauseForGCIfCollectionImminent();
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
            if(_microphone != null) {
                switch(_microphone.rate) {
                    case 44:
                        return 44100;
                        break;
                    case 22:
                        return 22050;
                        break;
                    case 16:
                        return 16000;
                        break;
                    case 11:
                        return 11025;
                        break;
                    case 8:
                        return 8000;
                    case 5:
                        return 5513;
                    default:
                        return _microphone.rate * 1000;
                }
            }
            return NaN;
        }
    }
}