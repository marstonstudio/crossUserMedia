package {

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

    import org.bytearray.micrecorder.MicRecorder;
    import org.bytearray.micrecorder.encoder.PassThruEncoder;
    import org.bytearray.micrecorder.encoder.WavEncoder;
    import org.bytearray.micrecorder.events.RecordingEvent;
    
    [SWF(width="310", height="138", frameRate="31", backgroundColor="#F5F5DC")]
    public class Main extends Sprite {

        private var _recorder:MicRecorder = new MicRecorder( new WavEncoder() );

        private var _display:TextField;

        [Embed(systemFont="Arial",
                fontName = "arialFont",
                mimeType = "application/x-font",
                fontWeight="normal",
                fontStyle="normal",
                unicodeRange="U+0020-007E",
                advancedAntiAliasing="true",
                embedAsCFF="false")]
        private var arialEmbeddedFont:Class;

        public function Main() {
            addEventListener(Event.ADDED_TO_STAGE, onAddedToStage);
        }

        private function onAddedToStage(event:Event):void {
            var format:TextFormat = new TextFormat();
            format.font = "arialFont";
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

            _recorder.addEventListener(RecordingEvent.RECORDING, onRecording);
            _recorder.addEventListener(Event.COMPLETE, onRecordComplete);
            _recorder.gain = 75;

            ExternalInterface.addCallback("startRecording", externalStartRecording);
            ExternalInterface.addCallback("stopRecording", externalStopRecording);
        }

        private function externalStartRecording():void {
            _display.text = "clicked start";
            _recorder.record();
        }

        private function externalStopRecording():void {
            _display.text = "clicked stop";
            _recorder.stop();
        }

        private function onRecording(event:RecordingEvent):void {
            _display.text = "recording since : " + event.time + " ms.";
        }

        private function onRecordComplete(event:Event):void {
            _display.text = "saving recorded sound.";

            var b64:Base64Encoder = new Base64Encoder();
            b64.insertNewLines = false;
            b64.encodeBytes(_recorder.output);
            ExternalInterface.call("onFlashSoundRecorded", b64.toString());
        }

    }
}