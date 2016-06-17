#!/usr/bin/env bash

#Set to exit on any failure
set -e

cd ../ffmpeg

:<<"EOF"

#Only perform the make clean beforehand if the configure script has been called before
# This can be easily identified by checking for the existance of "config.mak"
if [ -f "config.mak" ]
then
    echo "Cleaning past configuration"
    emmake make clean
    echo "Cleaned past configuration"
fi

EOF

echo "Starting ffmpeg configuration"
emconfigure /usr/bin/sh ./configure \
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
    --disable-decoders \
    --enable-decoder=pcm_f32le \
    --disable-hwaccels \
    --disable-muxers \
    --enable-muxer=mp4 \
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
    #--extra-cflags=-Wno-error=implicit-function-declaration

#ADDED above flags

echo "Finished ffmpeg configuration"

#EOF

emmake make
emmake make install
emmake make clean

cd ../js

emmake make clean
emmake make
emmake make install
