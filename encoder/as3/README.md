
## Setup

1. Ensure that you are running on either a Cygwin or Mac environment.

2. Download air sdk 18.0 from https://helpx.adobe.com/air/kb/archived-air-sdk-version.html and unpack the contents to the location /usr/local/air_sdk

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
4. Download and install the crossbridge compiler from http://crossbridge.io and unpack the contents to the location /usr/local/crossbridge

4. Run `build.sh` either from Cygwin or from a Mac terminal window.

### Cygwin Caveats

On first run, numerous errors like `$'\r': command not found` may appear. If so, install the `dos2unix` command and apply it to all of the complaining files to convert the dos line endings to their prettier unix equivalents.

The internal call to make may fail on building sha512.o due to an error: "Couldn't fork: Resource temporarily unavailable". In such case, make sure that there are no other Cygwin or Cygwin-related processes running except the current terminal window; close/terminate them if they exists. Also close any memory hogging programs. Rerun `build.sh`, but comment out the ffmpeg's make clean and configure to save some time (uncomment the `#:<<"EOF"` and `#EOF` to do so).

5. Once `build.sh` has built, which configures and compiles ffmpeg internally, you can compile just your project by running:

   ```
   source setenv.sh
   make
   make install
   ```

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
