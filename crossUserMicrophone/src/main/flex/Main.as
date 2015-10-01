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
    import flash.events.MouseEvent;
    import flash.events.TimerEvent;
    import flash.external.ExternalInterface;
    import flash.system.Security;
    import flash.system.SecurityPanel;
    import flash.utils.Timer;

    import mx.utils.Base64Encoder;

    [SWF(width="430", height="276", frameRate="24", backgroundColor="#FFFFFF")]
    public class Main extends Sprite {

        private var _recorder:MicRecorder;

        private var _textField:CFFTextField;

        private var _background:Sprite;

        private var _microphonePermissionConfirmed:Boolean;
        private var _microphonePermissionTimer:Timer;
        private const _microphonePermissionDelay:Number = 3000;

        private const _backgroundWidth:int = 430;
        private const _backgroundHeight:int = 276;
        private const _backgroundLine:int = 6;

        /*
         IntelliJ 14.1 unable to embed CFF Fonts which are supported by flexmojos 7.1.0
         to prevent build error must add a compiler option to in IntelliJ overriding value set in pom.xml
         File->Project Structure->Modules->crossUserMicrophone->Compiler Options->Additional compiler options->"-define+=CONFIG::cffFont,false"

         http://apache-flex-users.2333346.n4.nabble.com/Flex-Mojos-Fonts-and-Theme-Questions-tc10999.html
         https://youtrack.jetbrains.com/issue/IDEA-144541
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

        public function Main() {
            Console.log("FLASH::Main buildTimestamp:" + BUILD::timestamp + ", cffFont:" + CONFIG::cffFont);

            this.addEventListener(Event.ADDED_TO_STAGE, onAddedToStage);
        }

        private function onAddedToStage(event:Event):void {

            _background = new Sprite();
            _background.buttonMode = true;
            _background.graphics.lineStyle(3,0x212121);
            _background.graphics.beginFill(0xFFFFFF);
            _background.graphics.drawRoundRect(0, 0, _backgroundWidth - _backgroundLine/2, _backgroundHeight - _backgroundLine/2, _backgroundLine*2);
            _background.graphics.endFill();
            addChild(_background);

            _textField = new CFFTextField();
            _textField.mouseEnabled = false;
            _textField.init(CONFIG::cffFont ? "SourceSansPro" : "Arial", 0x424242, CONFIG::cffFont, 16, _backgroundWidth);
            _background.addChild(_textField);
            _textField.text = "Please enable microphone access in privacy settings.";
            _textField.y = 32;

            stage.align = StageAlign.TOP_LEFT;
            stage.scaleMode = StageScaleMode.NO_SCALE;
            stage.addEventListener(Event.RESIZE, onStageResize);
            stage.dispatchEvent(new Event(Event.RESIZE));
            stage.addEventListener(MouseEvent.CLICK, onStageClick);

            ExternalInterface.marshallExceptions = true;
            ExternalInterface.addCallback("setFlashVisible", setFlashVisible);
            ExternalInterface.addCallback("startRecording", externalStartRecording);
            ExternalInterface.addCallback("stopRecording", externalStopRecording);

            _microphonePermissionConfirmed = false;
            _microphonePermissionTimer = new Timer(_microphonePermissionDelay, 1);
            _microphonePermissionTimer.addEventListener(TimerEvent.TIMER_COMPLETE, onMicrophonePermissionTimerComplete);

            Security.showSettings(SecurityPanel.PRIVACY);
        }

        private function onStageResize(event:Event):void {
            //Console.log("FLASH::onStageResize stageWidth:" + stage.stageWidth + ", stageHeight:" + stage.stageHeight);
            _background.x = (stage.stageWidth - _background.width) / 2;
            _background.y = (stage.stageHeight - _background.height) / 2;
        }

        private function onStageClick(event:MouseEvent):void {
            setFlashVisible(false);
        }

        private function setFlashVisible(value:Boolean):void {
            if(value) {
                _textField.text = "Please enable microphone access in privacy settings.";
                _textField.x = (_backgroundWidth - _textField.textWidth) / 2;
                Security.showSettings(SecurityPanel.PRIVACY);
                stage.addEventListener(Event.ENTER_FRAME, onCheckSettingsOpen);
                ExternalInterface.call("onFlashVisibilityChange", true);
            } else {
                _textField.text = "This window will close in a moment.";
                _textField.x = (_backgroundWidth - _textField.textWidth) / 2;
                stage.removeEventListener(Event.ENTER_FRAME, onCheckSettingsOpen);
                ExternalInterface.call("onFlashVisibilityChange", false);
            }
        }

        //http://stackoverflow.com/questions/5315076/securitypanel-close-event
        //http://stackoverflow.com/questions/6945055/flash-security-settings-panel-listening-for-close-event
        private function onCheckSettingsOpen(event:Event):void {
            var detector:BitmapData = new BitmapData(1, 1);
            try {
                detector.draw(stage);
                setFlashVisible(false);
            } catch(error:Error) {
            } finally {
                detector.dispose();
                detector = null;
            }
        }

        private function externalStartRecording():void {
            //Console.log("FLASH::Main::externalStartRecording");
            ExternalInterface.call("onFlashStatusMessage", "recording started");

            if(!_microphonePermissionConfirmed) {
                _microphonePermissionTimer.reset();
                _microphonePermissionTimer.start();
            }

            _recorder = new MicRecorder();
            _recorder.addEventListener(RecordingEvent.RECORDING, onRecording);
            _recorder.addEventListener(RecordingEvent.COMPLETE, onRecordComplete);
            _recorder.record();

        }

        private function externalStopRecording():void {
            //Console.log("FLASH::Main::externalStopRecording");
            _recorder.stop();
            ExternalInterface.call("onFlashStatusMessage", "recording stopped");
        }

        private function onRecording(event:RecordingEvent):void {
            //Console.log("FLASH::Main::onRecording");

            if(!_microphonePermissionConfirmed) {
                _microphonePermissionConfirmed = true;
                _microphonePermissionTimer.stop();
            }

            ExternalInterface.call("onFlashRecording", event.time / 1000, _recorder.activityLevel);
        }

        private function onMicrophonePermissionTimerComplete(event:TimerEvent):void {
            //Console.log("FLASH::Main::onMicrophonePermissionTimerComplete");
            setFlashVisible(true);
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