#!/usr/bin/env bash

. setenv.sh

rm -Rf dist
mkdir dist

cd ../ffmpeg

make clean

emconfigure ./configure \
    --prefix=../as3/dist \
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
    --enable-decoder=pcm_f32be \
    --disable-hwaccels \
    --disable-muxers \
    --enable-muxer=mp4 \
    --disable-demuxers \
    --enable-demuxer=pcm_f32be \
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
\
    --disable-asm \
    --disable-fast-unaligned \
\
    --disable-debug \
    --disable-stripping

make
make install
make clean

cd ../as3

make clean
make
make install
