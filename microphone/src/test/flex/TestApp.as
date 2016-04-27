package {

import com.marstonstudio.crossusermedia.encoder.Encoder;

import flash.display.DisplayObjectContainer;
import flash.display.Sprite;

import flash.events.Event;
import flash.utils.ByteArray;
import flash.utils.getTimer;

import mx.core.ByteArrayAsset;
import mx.core.UIComponent;

import org.flexunit.asserts.assertNotNull;

import org.flexunit.asserts.assertTrue;
import org.flexunit.async.Async;
import org.fluint.uiImpersonation.UIImpersonator;

public class TestApp {

        public function TestApp() {}

        [Embed(source="../resources/audio.pcm",mimeType="application/octet-stream")]
        public var AudioPcm:Class;
    
        public var container:DisplayObjectContainer;

        [Before(async,ui)]
        public function initialize():void {
            trace("+++++++++++++++++++++++++++++++++++++++++++++++++++++++");
            trace("test::start " + new Date().toLocaleString());
            trace("");
            container = new UIComponent();
            Async.proceedOnEvent(this, container, Event.ADDED_TO_STAGE, 100);
            UIImpersonator.addChild(container);
        }
        
        [Test(description="Load audio asset")]
        public function testAudioLoad():void {

            var audioPcmAsset:ByteArrayAsset = new AudioPcm();
            assertTrue("embedded bytesAvailable", audioPcmAsset.bytesAvailable > 0);

            assertNotNull(container.stage);
            var rootSprite:Sprite = new Sprite();
            container.addChild(rootSprite);

            const inputFormat:String = 'f32be';
            const inputSampleRate:int = 16000;
            const outputFormat:String = 'f32be';
            const outputSampleRate:int = 16000;
            const outputBitRate:int = 32000;

            var encoder:Encoder = new Encoder(rootSprite);
            encoder.init(inputFormat, inputSampleRate, outputFormat, outputSampleRate, outputBitRate);
            encoder.load(audioPcmAsset);
            var output:ByteArray = encoder.flush();

            assertTrue("outputFormat set to " + outputFormat, encoder.getOutputFormat() == outputFormat);
            assertTrue("outputSampleRate set to " + outputSampleRate, encoder.getOutputSampleRate() == outputSampleRate);
            assertTrue("outputLength > 0 = " + encoder.getOutputLength(), encoder.getOutputLength() > 0);
            
            encoder.dispose(0);
        }
    
        [After(ui)]
        public function finalize():void {
            UIImpersonator.removeAllChildren();
            container = null;

            trace("");
            trace("test::complete " + new Date().toLocaleString());
            trace("=======================================================");
            sleep(1000);
        }

        private function sleep(ms:int):void {
            var init:int = getTimer();
            while(true) {
                if(getTimer() - init >= ms) {
                    break;
                }
            }
        }

    }
}
