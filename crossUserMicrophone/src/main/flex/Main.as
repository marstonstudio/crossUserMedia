package {

    import com.marstonstudio.crossUserServer.events.RecordingEvent;
    import com.marstonstudio.crossUserServer.microphone.MicRecorder;

    import flash.display.Sprite;
    import flash.display.StageAlign;
    import flash.display.StageScaleMode;
    import flash.events.Event;
    import flash.external.ExternalInterface;
    import flash.text.AntiAliasType;
    import flash.text.TextField;
    import flash.text.TextFieldAutoSize;
    import flash.text.TextFormat;

    import mx.utils.Base64Encoder;

    public class Main extends Sprite {

        public static const BUILD_TIMESTAMP:String = BUILD::timestamp;

        private var _recorder:MicRecorder;

        private var _display:TextField;

        //AdobeSansF1-Regular.otf
        //SourceSansPro-Regular.otf"
        //Arial.ttf
        [Embed( source = "../resources/Arial.ttf",
            mimeType = "application/x-font",
            fontFamily = "recorderFont",
            embedAsCFF="true")]
        private var recorderFontEmbed:Class;

        public function Main() {
            addEventListener(Event.ADDED_TO_STAGE, onAddedToStage);
        }

        private function onAddedToStage(event:Event):void {
            var format:TextFormat = new TextFormat();
            format.font = "recorderFont";
            format.size = 16;

            _display = new TextField();
            _display.embedFonts = true;
            _display.antiAliasType = AntiAliasType.ADVANCED;
            _display.defaultTextFormat = format;
            _display.selectable = false;
            _display.text = "flash microphone widget";
            stage.align = StageAlign.TOP_LEFT;
            stage.scaleMode = StageScaleMode.NO_SCALE;
            _display.autoSize = TextFieldAutoSize.LEFT;
            addChild(_display);

            ExternalInterface.addCallback("startRecording", externalStartRecording);
            ExternalInterface.addCallback("stopRecording", externalStopRecording);
        }

        private function externalStartRecording(useSpeex:Boolean = false):void {
            _display.text = "clicked start " + (useSpeex ? "with speex" : "with wav");

            _recorder = new MicRecorder( useSpeex );
            _recorder.addEventListener(RecordingEvent.RECORDING, onRecording);
            _recorder.addEventListener(RecordingEvent.COMPLETE, onRecordComplete);
            _recorder.record();
        }

        private function externalStopRecording():void {
            _display.text = "clicked stop";
            _recorder.stop();
        }

        private function onRecording(event:RecordingEvent):void {
            _display.text = "recording since : " + event.time + " ms.";
        }

        private function onRecordComplete(event:RecordingEvent):void {
            _display.text = "saving recorded sound.";

            var b64:Base64Encoder = new Base64Encoder();
            b64.insertNewLines = false;
            b64.encodeBytes(event.data);
            ExternalInterface.call("onFlashSoundRecorded", b64.toString());
        }

    }
}