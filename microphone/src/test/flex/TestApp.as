package {

import com.marstonstudio.crossusermedia.encoder.Encoder;

import flash.display.DisplayObjectContainer;

import flash.events.Event;
import flash.utils.ByteArray;

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

            const sampleRate:int = 16000;
            const format:String = 'f32be';
            const bitRate:int = 32000;
            
            var encoder:Encoder = new Encoder(container);
            encoder.init(format, sampleRate, format, sampleRate, bitRate);
            encoder.load(audioPcmAsset);
            var output:ByteArray = encoder.flush();
            
            assertTrue("outputSampleRate set to " + sampleRate, encoder.getOutputSampleRate() == sampleRate);
            assertTrue("outputFormat set to " + format, encoder.getOutputFormat() == format);
            assertTrue("outputLength = audioPcmAsset.length = " + audioPcmAsset.length, encoder.getOutputLength() == audioPcmAsset.length);
            assertTrue("output.length = audioPcmAsset.length = " + audioPcmAsset.length, output.length == audioPcmAsset.length);
            
            encoder.dispose(0);
        }
    
        [After]
        public function finalize():void {
            UIImpersonator.removeAllChildren();
            container = null;

            trace("");
            trace("test::complete " + new Date().toLocaleString());
            trace("=======================================================");
        }

    }
}
