package {

import com.marstonstudio.crossusermedia.encoder.Encoder;

import mx.core.ByteArrayAsset;

import org.flexunit.asserts.assertTrue;

public class TestApp {

        public function TestApp() {}

        [Embed(source="../resources/audio.pcm",mimeType="application/octet-stream")]
        public var AudioPcm:Class;
        
        [Test(description="Load audio asset")]
        public function testAudioLoad():void {
            trace("testAudioLoad :: " + new Date().toLocaleString());

            var audioPcmAsset:ByteArrayAsset = new AudioPcm();
            assertTrue("testing asserts", audioPcmAsset.bytesAvailable > 0);
            
            var encoder:Encoder = new Encoder();
            encoder.init('f32be', 16000, 'f32be', 16000, 32000);
        }
    }
}
