package com.marstonstudio.crossusermedia.microphone {

import com.marstonstudio.crossusermedia.encoder.Encoder;
import com.marstonstudio.crossusermedia.microphone.events.RecordingEvent;
import com.marstonstudio.crossusermedia.microphone.util.Console;

import flash.display.Sprite;
import flash.events.EventDispatcher;
import flash.events.SampleDataEvent;
import flash.events.StatusEvent;
import flash.media.Microphone;
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

        private const _maxSeconds:int = 30;

        private const _defaultSilenceLevel:uint = 0;
        private const _defaultSilenceLevelTimeOut:uint = 4000;
        private const _defaultSampleRateKHz:int = 16;
        private const _defaultGain:uint = 75;

        private const _channels:int = 1;

        private const _pcmFormat:String = "f32be";
        private const _pcmCodec:String = "pcm_f32be";

        private const _outputFormat:String = "mp4";
        private const _outputCodec:String = "aac";
        private const _outputSampleRateHz:int = 16000;

        private const _outputBitRate:int = 32000;

        private var _startTime:uint;
        private var _microphone:Microphone;
        private var _encoder:Encoder;
        private var _rootSprite:Sprite;
        private var _gain:uint = _defaultGain;

        public function Recorder(rootSprite:Sprite) {
            this._rootSprite = rootSprite;
        }

        private function init(index:int):void {

            if(!Microphone.isSupported || Microphone.names == null || Microphone.names.length == 0) {
                throw new Error("No microphones found");
            }

            if(_microphone != null) _microphone.removeEventListener(StatusEvent.STATUS, onStatus);

            if(index >= Microphone.names.length) {
                Console.warn("Recorder.as", "selected microphone index " + index + ", not found, using default 0");
                _microphone = Microphone.getMicrophone();
            }

            if ( _microphone == null || _microphone.index != index) {
                _microphone = Microphone.getMicrophone(index);
                Console.log("Recorder.as", "switched to microphone index: " + index + ", name: " + _microphone.name);
            }

            _microphone.addEventListener(StatusEvent.STATUS, onStatus);

            if(_microphone == null) {
                throw new Error("Unable to set microphone");
            }
        }

        /**
         * Starts recording from the default or specified microphone.
         * The first time the record() method is called the settings manager may pop-up to request access to the Microphone.
         */
        public function record():void {

            if(_microphone == null) init(0);

            _microphone.setSilenceLevel(_defaultSilenceLevel, _defaultSilenceLevelTimeOut);
            _microphone.noiseSuppressionLevel = 0;
            _microphone.rate = _defaultSampleRateKHz;
            _microphone.gain = _gain;

            _startTime = getTimer();

            _microphone.addEventListener(SampleDataEvent.SAMPLE_DATA, onSampleData);
        }

        /**
         * Dispatched during the recording.
         * @param event
         */
        private function onSampleData(event:SampleDataEvent):void {
            var time:Number = getTimer() - _startTime;
            dispatchEvent( new RecordingEvent(RecordingEvent.SAMPLE_DATA, time) );

            if(_encoder == null) {
                _encoder = new Encoder(_rootSprite);
                _encoder.init(  _pcmFormat, _pcmCodec, sampleRate, _channels,
                        _outputFormat, _outputCodec, _outputSampleRateHz, _channels,
                        _outputBitRate, _maxSeconds);
            }

            _encoder.load(event.data);
        }

        private function onStatus(event:StatusEvent):void {
            Console.log("Recorder.as", "Microphone status event level:" + event.level + ", code:" + event.code)
        }

        /**
         * Stop recording the audio stream and automatically starts the packaging of the output file.
         */
        public function stop():void {
            _microphone.removeEventListener(SampleDataEvent.SAMPLE_DATA, onSampleData);
            if(_encoder != null) _encoder.load();
            //_rootSprite must have a listener for EncoderEvent.COMPLETE
        }

        public function dispose():void {
            if(_encoder != null) _encoder.dispose(0);
            _encoder = null;
            //System.pauseForGCIfCollectionImminent();
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

        public function get availableMicrophoneNames():Array {
            return Microphone.names;
        }

        public function get currentMicrophoneName():String {
            return _microphone == null ? null : _microphone.name;
        }

        public function set currentMicrophoneName(name:String):void {

            if(name == null) init(0);

            for(var i:int=0; i<Microphone.names.length; i++) {
                if(Microphone.names[i] == name) {
                    init(i);
                    return;
                }
            }
            Console.warn("Recorder.as", "microphone name not found: " + name + ", using default");
            init(0);
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

        public function get boostedActivityLevel():Number {
            return Math.round(25.4 * Math.log((activityLevel + 2)/2));
        }

    }
}