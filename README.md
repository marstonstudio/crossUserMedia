# crossUserMedia #

crossUserMedia demonstrates how to use the HTML5 getUserMedia control and the Flash Microphone object for a cross browser audio file recorder.
The demo allows a user to record sound using the microphone from a browser session, pipeline the raw PCM bytes to a clientside ffmpeg encoder, and then play the audio back as an AAC encoded MP4 file.

I built this project to serve as a proof of concept for moving the speech powered video player on [www.englishcentral.com](https://www.englishcentral.com) from Flash to HTML5. 
We had a requirement to record compressed audio in the browser for uploading to a server, which is not the standard use case for WebRTC.
Chrome and Firefox each have support for the similar MediaRecorder API, but we wanted to record AAC files instead of OPUS, and we needed to support older browsers including IE11.

![Image of Recording](https://raw.githubusercontent.com/marstonstudio/crossUserMedia/master/assets/images/recording.png)
Presented here is a single C wrapper around the FFMPEG libraries that is compiled into both JavaScript using Emscripten and Flash using Crossbridge.
The user interface is written in AngularJS for all Browsers. 
Browsers that support getUserMedia() will use HTML5 microphone access and send PCM data to a web worker running FFMPEG without any Flash.
Browsers without getUserMedia() use a hidden Flash control that provides microphone and compresses the audio using FFMPEG; the audio is returned to the AngularJS as Base64 encoded call using ExternalInterface.

![Image of Permissions](https://raw.githubusercontent.com/marstonstudio/crossUserMedia/master/assets/images/flashpermissions.png)
![Image of Permissions](https://raw.githubusercontent.com/marstonstudio/crossUserMedia/master/assets/images/html5permissions.png)

When I was writing this project I drew upon a wide set of fragments and snippets of code from other people's work across the web.
In particular, I was inspired by the work of [Thibault Imbert](http://www.adobe.com/devnet/author_bios/thibault_imbert.html) on capturing microphone audio in [JavaScript](http://typedarray.org/from-microphone-to-wav-to-server/) and [ActionScript](http://www.bytearray.org/?p=1858).
I also drew from a similar [HTML5 Microphone & Web Audio Demo](https://dev.modern.ie/testdrive/demos/microphone/) available for Microsoft EDGE browser.

I'm presenting the code on github to return to the community of people that are hacking difficult projects involving Emscripten, Web Audio, or FFMEPG.
I believe it will be useful for others that are hunting for examples of setting up Makefiles and other fragments.
I have done my best to fully document setting up this project in an environment, but I will say that it is tricky and difficult.
If anyone out there endeavors to try and get all of this running, please feel free to reach out to me through a ticket and I'll see if I can help.

An Angular Typescript version of this player has been running in production since Spring of 2017 on EnglishCentral. 
In our final version we used NPM repositories to simplify the links between different components and removed gulp.js.

## Requirements ##
* [Java 8 JDK](http://www.oracle.com/technetwork/java/javase/downloads/index.html)
* [Maven 3.2](https://maven.apache.org/download.cgi)
* [Tomcat 8](https://tomcat.apache.org)

## Setup Steps ##
* [Mavenized Apache Flex artifacts - Documented in microphone/README.md](microphone/README.md)
* [Font tools - Documented in frontend/README.md](frontend/README.md)
* [Emscripten - Documented in encoder/js/README.md](encoder/js/README.md)
* [Crossbridge - Documented in encoder/as3/README.md](encoder/as3/README.md)