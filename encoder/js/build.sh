#!/usr/bin/env bash

set -e

cd ../ffmpeg

#Only perform the make clean beforehand if the configure script has been called before
if [ -f "config.mak" ]
then
    echo "Cleaning past configuration"
    emmake make clean
fi

emconfigure ./configure \
    --prefix=../js/dist \
\
    --disable-runtime-cpudetect \
\
    --disable-ffmpeg \
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
    --enable-encoder=pcm_f32le \
    --disable-decoders \
    --enable-decoder=pcm_f32le \
    --disable-hwaccels \
    --disable-muxers \
    --enable-muxer=mp4 \
    --enable-muxer=pcm_f32le \
    --disable-demuxers \
    --enable-demuxer=pcm_f32le \
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
    --arch=x86_64 \
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

echo "Finished ffmpeg configuration"

emmake make
emmake make install
emmake make clean

cd ../js

emmake make clean
emmake make
emmake make install
