# crossUserMedia #

crossUserMedia demonstrates how to use the HTML5 getUserMedia control and the Flash Microphone object for a cross browser audio file recorder.
The demo allows a user to record sound using the microphone from a browser session, pipeline the raw PCM bytes to a clientside ffmpeg encoder, and then play the audio back as an AAC encoded MP4 file.

Inspired the work of [Thibault Imbert](http://www.adobe.com/devnet/author_bios/thibault_imbert.html) on capturing microphone audio in [JavaScript](http://typedarray.org/from-microphone-to-wav-to-server/) and [ActionScript](http://www.bytearray.org/?p=1858).

A similar [HTML5 Microphone & Web Audio Demo](https://dev.modern.ie/testdrive/demos/microphone/) is available for Microsoft EDGE browser.

## Requirements ##
* [Java 8 JDK](http://www.oracle.com/technetwork/java/javase/downloads/index.html)
* [Maven 3.2](https://maven.apache.org/download.cgi)
* [Tomcat 8](https://tomcat.apache.org)
* [Mavenized Apache Flex artifacts](microphone/README.md)
* [Font tools](frontend/README.md)
* [Emscripten](encoder/js/README.md)
* [Crossbridge](encoder/as3/README.md)

### Coding TODO ###

- [ ] handle max recording length timeout
- [ ] updated deprecated ffmpeg avcodec_decode_audio4() and avcodec_encode_audio2()
- [ ] support sample rate conversion in encoder
- [ ] JNI wrapper for ffmpeg decoder
- [ ] microphone selector using enumerateDevices()