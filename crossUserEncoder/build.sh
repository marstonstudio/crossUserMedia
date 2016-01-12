#!/usr/bin/env bash

rm -Rf tmp
mkdir tmp

cd ffmpeg
emmake make clean

emconfigure ./configure \
    --prefix=../tmp \
\
    --disable-runtime-cpudetect \
\
    --disable-ffplay \
    --disable-ffprobe \
    --disable-ffserver \
\
    --disable-doc \
\
    --disable-pthreads \
    --disable-w32threads \
    --disable-os2threads \
\
    --disable-d3d11va \
    --disable-dxva2 \
    --disable-vaapi \
    --disable-vda \
    --disable-vdpau \
\
    --disable-encoders \
    --enable-encoder=aac \
    --disable-decoders \
    --enable-decoder=pcm_s16le \
    --disable-hwaccels \
    --disable-muxers \
    --enable-muxer=mp4 \
    --disable-demuxers \
    --enable-demuxer=wav \
    --disable-parsers \
    --disable-bsfs \
    --disable-protocols \
    --enable-protocol=file \
    --disable-indevs \
    --disable-outdevs \
    --disable-filters \
    --enable-filter=aresample \
\
    --disable-iconv \
    --disable-sdl \
    --disable-securetransport \
    --disable-xlib \
\
    --arch=x86_32 \
    --cpu=generic \
    --enable-cross-compile \
    --target-os=none \
    --cross-prefix=em \
    --cc=emcc \
\
    --disable-asm \
    --disable-fast-unaligned \
\
    --disable-debug \
    --disable-stripping

emmake make

cd ..
cp ffmpeg/ffmpeg tmp/ffmpeg.bc

sed -e '\/\*EMSCRIPTENBODY\*\//,$d' src/interface.js > tmp/pre.js
sed -e '1,\/\*EMSCRIPTENBODY\*\//d' src/interface.js > tmp/post.js

emcc -O3 -s OUTLINING_LIMIT=100000 -s TOTAL_MEMORY=67108864 tmp/ffmpeg.bc -o index.js --pre-js tmp/pre.js --post-js tmp/post.js

npm test
npm publish
