#!/usr/bin/env bash

rm -Rf dist
mkdir dist
cd ffmpeg

emconfigure ./configure \
    --prefix=../dist \
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

emmake make clean
emmake make

cp ffmpeg ../dist/ffmpeg.bc
emcc -O3 -s OUTLINING_LIMIT=100000 -s TOTAL_MEMORY=67108864 ../dist/ffmpeg.bc -o ../dist/ffmpeg.js --pre-js ../pre.js --post-js ../post.js

emmake make clean

gzip -k ../dist/ffmpeg.js
gzip -k ../dist/ffmpeg.js.mem
ls -lha ../dist
