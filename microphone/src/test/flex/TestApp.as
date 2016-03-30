package {

    import mx.core.ByteArrayAsset;

    import org.flexunit.asserts.assertTrue;
    import com.marstonstudio.crossusermedia.encoder.Encoder;

    public class TestApp {

        public function TestApp() {}

        [Embed(source="../resources/audio.pcm",mimeType="application/octet-stream")]
        public var AudioPcm:Class;
        
        [Test(description="Load audio asset")]
        public function testAudioLoad():void {
            //trace("testAudioLoad :: " + new Date().toLocaleString());

            var audioPcmAsset:ByteArrayAsset = new AudioPcm();
            //assertTrue("testing asserts", audioPcmAsset.bytesAvailable > 0);
            
            var encoder:Encoder = new Encoder("hello");
            //encoder.encode("world")
        }
    }
}
