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

        private static const WIDTH:Number = 215;

        private var _recorder:MicRecorder;

        private var _textField:CFFTextField;

        private static const FONT_NAME:String = "recorderFont";

        private static const FONT_SIZE:Number = 16;

        [Embed( source = "../resources/Arial.ttf",
                mimeType = "application/x-font-truetype-collection",
                fontFamily = "recorderFont",
                fontWeight = "Regular",
                fontStyle = "Regular",
                embedAsCFF = "true")]
        private var recorderFontTTFEmbed:Class;

        /*
        Works for flexmojo, but not IntelliJ
        */
        /*
        [Embed( source = "../resources/SourceSansPro-Regular.otf",
                mimeType = "application/x-font-opentype",
                fontFamily = "recorderFont",
                fontWeight = "Regular",
                fontStyle = "Regular",
                embedAsCFF = "true")]
        private var recorderFontOTFEmbed:Class;
        */

        public function Main() {
            Console.log("Flash Microphone build timestamp:" + BUILD::timestamp);
            Console.logCapabilities();

            this.addEventListener(Event.ADDED_TO_STAGE, onAddedToStage);
        }

        private function onAddedToStage(event:Event):void {

            stage.align = StageAlign.TOP_LEFT;
            stage.scaleMode = StageScaleMode.NO_SCALE;

            _textField = new CFFTextField();
            _textField.init(FONT_NAME, FONT_SIZE, WIDTH);
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