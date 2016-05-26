
## Setup

1. Ensure that you are running on either a Cygwin or Mac environment.

2. Download air sdk 18.0 from https://helpx.adobe.com/air/kb/archived-air-sdk-version.html

3. Navigate to `frameworks/flex-config.xml` and at about line 46, replace as follows:

   From
   ```
   <external-library-path>
    <path-element>libs/player/{targetPlayerMajorVersion}.{targetPlayerMinorVersion}/playerglobal.swc</path-element>
   </e xternal-library-path>
   ```
   
   To
   ```
   <external-library-path>
    <path-element>libs/player/18.0/playerglobal.swc</path-element>
   </e xternal-library-path>
   ```

4. Run `build.sh` either from Cygwin or from a Mac terminal window.

   Note: On Cygwin, the internal call to make may fail on building sha512.o due to an error: "Couldn't fork: Resource temporarily unavailable". In such case, make sure that there are no other Cygwin or Cygwin-related processes running except the current terminal window; close/terminate them if they exists and rerun `build.sh`.

## Inspired by
* http://blog.elliotblackburn.co.uk/ffmpeg-with-flascccrossbridge/
* http://stackoverflow.com/questions/13690290/how-to-compile-ffmpeg-with-the-new-flascc-compiler
* http://flashywrappers.com
* https://forums.adobe.com/thread/1129448?tstart=0
* http://www.zeropointnine.com/blog/updated-flv-encoder-alchem/
* https://github.com/zeropointnine/leelib
* https://forums.adobe.com/thread/1173055?start=0&tstart=0
* https://forums.adobe.com/thread/1355229?start=0&tstart=0
* http://labs.byhook.com/2011/02/22/ogg-vorbis-encoder-decoder-for-flash/
* http://labs.byhook.com/2011/02/15/ogg-vorbis-encoder-for-flash-alchemy-series-part-1/
* http://labs.byhook.com/2011/05/03/alchemy-series-part-6-ogg-vorbis-library-source-release/
* http://stackoverflow.com/questions/6317816/how-to-compile-ffmpeg-via-alchemy-gcc
* http://www.adobe.com/devnet-docs/flascc/docs/Reference.html
* https://github.com/normanzb/encoder-mp3
* https://github.com/soywiz/as3libwebp
* https://github.com/claus/libtess2.swc
