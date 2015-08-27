package {

    import com.marstonstudio.crossUserServer.events.RecordingEvent;
    import com.marstonstudio.crossUserServer.microphone.MicRecorder;
    import com.marstonstudio.crossUserServer.sprites.CFFTextField;
    import com.marstonstudio.crossUserServer.util.Console;

    import flash.display.Sprite;
    import flash.display.StageAlign;
    import flash.display.StageScaleMode;
    import flash.events.Event;
    import flash.external.ExternalInterface;

    import mx.utils.Base64Encoder;

    public class Main extends Sprite {

        private var _recorder:MicRecorder;

        private var _textField:CFFTextField;

        CONFIG::cffFont {
            [Embed(source="../resources/fonts/SourceSansPro-Regular.otf",
                    mimeType="application/x-font-opentype",
                    fontFamily="SourceSansPro",
                    fontWeight="Regular",
                    fontStyle="Regular",
                    embedAsCFF="true")]
            private var recorderFontOTFEmbed:Class;
        }

        [SWF(width="215", height="138", frameRate="24")]
        public function Main() {
            Console.log("Flash Microphone buildTimestamp:" + BUILD::timestamp + ", cffFont:" + CONFIG::cffFont);
            Console.logCapabilities();

            this.addEventListener(Event.ADDED_TO_STAGE, onAddedToStage);
        }

        private function onAddedToStage(event:Event):void {

            stage.align = StageAlign.TOP_LEFT;
            stage.scaleMode = StageScaleMode.NO_SCALE;

            var fontName:String = CONFIG::cffFont ? "SourceSansPro" : "Arial";

            _textField = new CFFTextField();
            _textField.init(fontName, CONFIG::cffFont, 16, 215);
            addChild(_textField);
            _textField.text = "flash microphone";

            ExternalInterface.marshallExceptions = true;
            ExternalInterface.addCallback("startRecording", externalStartRecording);
            ExternalInterface.addCallback("stopRecording", externalStopRecording);
        }

        private function externalStartRecording(useSpeex:Boolean = false):void {
            _textField.text = "clicked start " + (useSpeex ? "with speex" : "with wav");

            _recorder = new MicRecorder( useSpeex );
            _recorder.addEventListener(RecordingEvent.RECORDING, onRecording);
            _recorder.addEventListener(RecordingEvent.COMPLETE, onRecordComplete);
            _recorder.record();
        }

        private function externalStopRecording():void {
            _textField.text = "clicked stop";
            _recorder.stop();
        }

        private function onRecording(event:RecordingEvent):void {
            _textField.text = "recording since : " + event.time + " ms.";
        }

        private function onRecordComplete(event:RecordingEvent):void {
            _textField.text = "saving recorded sound.";

            var b64:Base64Encoder = new Base64Encoder();
            b64.insertNewLines = false;
            b64.encodeBytes(event.data);
            ExternalInterface.call("onFlashSoundRecorded", b64.toString());

            _textField.text = "saved recorded sound.";
        }

    }
}