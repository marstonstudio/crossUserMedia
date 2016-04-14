#encoder.js

## Implementation

Encoder.js uses the [emscripten crosscompiler](http://kripken.github.io/emscripten-site) to compile [encoder.c](/encoder/c/encoder.c),
underlying FFMPEG libraries, and a javascript wrapper into [ams.js](http://asmjs.org) code which can be run in a browser.
It works great in Chrome, Firefox, Edge, and Safari and encodes audio at 3x real time.
It does not run fast in Internet Explorer because that browser does not have the [ams.js](http://asmjs.org) optimizations.
For Internet Explorer, see the ActionScript version [Encoder.swc](/encoder/as3/README.md).

The JavaScript cross compiled version of the encoder is bundled as an npm package and is intended to run in a
[web worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) thread.
The [build.sh](/encoder/js/build.sh) script only enables the `pcm_f32le` decoder for raw microphone input, the `aac` encoder, and the `mp4` muxer.
Change the `./configure` options in the [build.sh](/encoder/js/build.sh) script to support different encoders or output file formats.

The encoder has a custom C wrapper around the libav libraries from FFMPEG and does not use the actual `ffmpeg` program.
In [assets/draft/jsencoder/ffmpegwrapper.js](/assets/draft/jsencoder/ffmpegwrapper.js)
you can see an earlier implementation which used the `ffmpeg` program, `Module['arguments']`,
and the emscripten filesystem to pass audio in and out of the encoder.
Note that using this approach also requires making to the `./configure` options in [build.sh](/encoder/js/build.sh)
to build the `ffmpeg` program and use the `.bc` suffix.
See the [ffmpeg.js](https://github.com/Kagami/ffmpeg.js) project for a great example of this alternative approach.

Raw PCM data from the getUserMedia() microphone is passed to the worker as a `Float32Array.buffer`.
Output from the worker is a `Uint8Array.buffer` which can be loaded into a `Blob` and played in the browser using the `Audio` element.
See [frontend/scripts/factories/EncoderFactory.js](/frontend/scripts/factories/EncoderFactory.js)
for usage and examples of the JSON objects used to transfer messages and data back and forth from the web worker.

## Environment setup and installing emscripten



You can follow instructions on the [emscripten website](http://kripken.github.io/emscripten-site/docs/getting_started/downloads.html)
or use [homebrew](http://brew.sh) to install emscripten.

If using homebrew on OS X, do the following to install emscripten and generate the ~/.emscripten config file:
```
brew install emscripten node yuicompressor
emcc -v
```

If you get errors which say "python2 not found", try setting up a link to python2.
Skip this step if you have no error.
```
ln -sf /usr/bin/python2.7 /usr/local/bin/python2
```

If you get errors which say "emcc.py not found", then you may need to manually create symlinks for the emcc executables.
Skip this step if you have no error.
```
ln -s /usr/local/opt/emscripten/libexec/em++ /usr/local/opt/emscripten/libexec/em++.py
ln -s /usr/local/opt/emscripten/libexec/emar /usr/local/opt/emscripten/libexec/emar.py
ln -s /usr/local/opt/emscripten/libexec/emcc /usr/local/opt/emscripten/libexec/emcc.py
ln -s /usr/local/opt/emscripten/libexec/emcmake /usr/local/opt/emscripten/libexec/emcmake.py
ln -s /usr/local/opt/emscripten/libexec/emconfigure /usr/local/opt/emscripten/libexec/emconfigure.py
ln -s /usr/local/opt/emscripten/libexec/emmake /usr/local/opt/emscripten/libexec/emmake.py
```

Now follow instructions which appeared in the homebrew installation message about editing the path to LLVM in the ~/.emscripten config file.
Change the LLVM_ROOT property in ~/.emscripten from '/usr/bin' to be '/usr/local/opt/emscripten/libexec/llvm/bin'.
Confirm emscripten properly installed by running the sanity check.

```
emcc -v
```

You should see no errors in the emscripten sanity check output.

## Building the npm package

Now execute the full build which compiles the base FFMPEG libraries, compiles the encoder.js wrapper,
and installs the output into the node_modules/encoderjs folder in the frontend project.
Run the [build.sh](/encoder/js/build.sh) script in the `encoder/js/` folder.
```
./build.sh
```

This will take a long time.
The full build only needs to be done once to install the base FFMPEG libraries into the dist folder.
When doing development on the encoder, you can do faster compilation of just the custom encoder.c, pre.js, and post.js code by running:
```
make clean
make
make install
```

## Inspired by
* https://github.com/Kagami/ffmpeg.js
* https://github.com/fluent-ffmpeg/node-fluent-ffmpeg
* https://github.com/bgrins/videoconverter.js
* https://github.com/mattdiamond/Recorderjs
* http://qiita.com/ukyo/items/60b2e55f65eb525ce51c