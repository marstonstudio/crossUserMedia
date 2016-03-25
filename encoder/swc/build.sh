#!/usr/bin/env bash

FLASCC=/usr/local/crossbridge/sdk
FLEX=/usr/local/air_sdk
PATH=$FLASCC/usr/bin:$PATH

rm -Rf dist
mkdir dist

cd ../ffmpeg

make clean

./configure \
    --prefix=../swc/dist \
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
    --enable-decoder=pcm_f32be \
    --enable-decoder=pcm_f32le \
    --disable-hwaccels \
    --disable-muxers \
    --enable-muxer=mp4 \
    --disable-demuxers \
    --enable-demuxer=pcm_f32be \
    --enable-demuxer=pcm_f32le \
    --disable-parsers \
    --disable-bsfs \
    --disable-protocols \
    --enable-protocol=file \
    --enable-protocol=pipe \
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
\
    --disable-asm \
    --disable-fast-unaligned \
\
    --disable-debug \
    --disable-stripping

make
make install

cd ../swc

