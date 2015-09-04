package {

    import com.marstonstudio.crossUserServer.events.RecordingEvent;
    import com.marstonstudio.crossUserServer.microphone.MicRecorder;
    import com.marstonstudio.crossUserServer.sprites.CFFTextField;
    import com.marstonstudio.crossUserServer.util.Console;

import flash.display.BitmapData;

import flash.display.Sprite;
    import flash.display.StageAlign;
    import flash.display.StageScaleMode;
    import flash.events.Event;
import flash.events.FocusEvent;
import flash.events.MouseEvent;
import flash.external.ExternalInterface;
import flash.system.Security;
import flash.system.SecurityPanel;
import flash.system.System;

import mx.utils.Base64Encoder;

    public class Main extends Sprite {

        private var _recorder:MicRecorder;

        private var _textField:CFFTextField;

        /*
        IntelliJ 14.1 unable to embed CFF Fonts which are supported by flexmojos 7.1.0
        to prevent build error must add a compiler option to in IntelliJ overriding value set in pom.xml
        File->Project Structure->Modules->crossUserMicrophone->Compiler Options->Additional compiler options->"-define+=CONFIG::cffFont,false"
        */
        CONFIG::cffFont {
            [Embed(source="../../../../assets/fonts/SourceSansPro-Regular.otf",
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
            _textField.init(fontName, 0xFFFFFF, CONFIG::cffFont, 16, 215);
            addChild(_textField);
            _textField.text = "flash microphone settings";

            ExternalInterface.marshallExceptions = true;
            ExternalInterface.addCallback("showSettings", externalShowSettings);
            ExternalInterface.addCallback("startRecording", externalStartRecording);
            ExternalInterface.addCallback("stopRecording", externalStopRecording);

            Security.showSettings(SecurityPanel.PRIVACY);
        }

        //http://stackoverflow.com/questions/5315076/securitypanel-close-event
        //http://stackoverflow.com/questions/6945055/flash-security-settings-panel-listening-for-close-event
        private function externalShowSettings():void {
            var sprite:Sprite = new Sprite();
            stage.focus = sprite;
            sprite.addEventListener( FocusEvent.FOCUS_OUT, onFocus );
            sprite.addEventListener( FocusEvent.FOCUS_IN, onFocus );

            Security.showSettings(SecurityPanel.PRIVACY);
            //stage.addEventListener(Event.ENTER_FRAME, onFrameEnter);
            //stage.addEventListener(MouseEvent.MOUSE_MOVE, onMouseMove);
        }

        private function onFocus( event:FocusEvent ):void {
            event.target.removeEventListener( event.type, onFocus );
            if (event.type == FocusEvent.FOCUS_IN) {
                stage.focus = null;
                ExternalInterface.call("onFlashDisplayChange", false);
            }
        }

        private function onMouseMove(event:MouseEvent):void {
            stage.removeEventListener(MouseEvent.MOUSE_MOVE, onMouseMove);
            ExternalInterface.call("onFlashDisplayChange", false);
        }

        private function onFrameEnter(event:Event):void {
            var detector:BitmapData;
            detector = new BitmapData(1, 1);
            try {
                detector.draw(stage);
                Console.log("Flash settings detected closed");
                stage.removeEventListener(Event.ENTER_FRAME, onFrameEnter);
                ExternalInterface.call("onFlashDisplayChange", false);
            } catch(error:Error) {
            }
            detector.dispose();
            detector = null;
        }

        private function externalStartRecording(useSpeex:Boolean = false):void {
            ExternalInterface.call("onFlashStatusMessage", "recording started");

            _recorder = new MicRecorder( useSpeex );
            _recorder.addEventListener(RecordingEvent.RECORDING, onRecording);
            _recorder.addEventListener(RecordingEvent.COMPLETE, onRecordComplete);
            _recorder.record();
        }

        private function externalStopRecording():void {
            _recorder.stop();
            ExternalInterface.call("onFlashStatusMessage", "recording stopped");
        }

        private function onRecording(event:RecordingEvent):void {
            ExternalInterface.call("onFlashRecording", event.time / 1000, _recorder.activityLevel);
        }

        private function onRecordComplete(event:RecordingEvent):void {
            ExternalInterface.call("onFlashStatusMessage", "audio saving");

            var b64:Base64Encoder = new Base64Encoder();
            b64.insertNewLines = false;
            b64.encodeBytes(event.data);
            ExternalInterface.call("onFlashSoundRecorded", b64.toString());

            ExternalInterface.call("onFlashStatusMessage", "audio saved");
        }

    }
}