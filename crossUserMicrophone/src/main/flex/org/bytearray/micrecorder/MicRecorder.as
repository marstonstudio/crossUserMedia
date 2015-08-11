package org.bytearray.micrecorder {

    import com.marstonstudio.crossUserServer.util.Constants;

    import flash.events.Event;
    import flash.events.EventDispatcher;
    import flash.events.SampleDataEvent;
    import flash.events.StatusEvent;
    import flash.media.Microphone;
    import flash.utils.ByteArray;
    import flash.utils.getTimer;

    import org.bytearray.micrecorder.encoder.IEncoder;
    import org.bytearray.micrecorder.events.RecordingEvent;
    
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
    [Event(name='recording', type='org.bytearray.micrecorder.events.RecordingEvent')]
    
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
    [Event(name='complete', type='flash.events.Event')]

    /**
     * This tiny helper class allows you to quickly record the audio stream coming from the Microphone and save this as a physical file.
     * A WavEncoder is bundled to save the audio stream as a WAV file
     * @author Thibault Imbert - bytearray.org
     * @version 1.2
     * 
     */    
    public final class MicRecorder extends EventDispatcher {

        private var _gain:uint = 100;
        private var _difference:uint;
        private var _microphone:Microphone;
        private var _buffer:ByteArray = new ByteArray();
        private var _output:ByteArray;
        private var _encoder:IEncoder;

        private static const SILENCE_LEVEL:uint = 0;
        private static const TIME_OUT:uint = 4000;
        
        private var _completeEvent:Event = new Event ( Event.COMPLETE );
        private var _recordingEvent:RecordingEvent = new RecordingEvent( RecordingEvent.RECORDING, 0 );

        public function MicRecorder(encoder:IEncoder) {
            _encoder = encoder;
        }
        
        /**
         * Starts recording from the default or specified microphone.
         * The first time the record() method is called the settings manager may pop-up to request access to the Microphone.
         */        
        public function record():void {
            if ( _microphone == null )
                _microphone = Microphone.getMicrophone();
             
            _difference = getTimer();

            _microphone.setSilenceLevel(SILENCE_LEVEL, TIME_OUT);
            _microphone.rate = Constants.SAMPLE_RATE_SMALLFORM;
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
            _recordingEvent.time = getTimer() - _difference;
            
            dispatchEvent( _recordingEvent );
            
            while(event.data.bytesAvailable > 0)
                _buffer.writeFloat(event.data.readFloat());
        }
        
        /**
         * Stop recording the audio stream and automatically starts the packaging of the output file.
         */        
        public function stop():void {
            _microphone.removeEventListener(SampleDataEvent.SAMPLE_DATA, onSampleData);
            
            _buffer.position = 0;
            _output = _encoder.encode(_buffer);
            
            dispatchEvent( _completeEvent );
        }

        public function get gain():uint {
            return _gain;
        }

        public function set gain(value:uint):void {
            _gain = value;
            if(_microphone != null) _microphone.gain = _gain;
        }

        public function get output():ByteArray {
            return _output;
        }
    }
}