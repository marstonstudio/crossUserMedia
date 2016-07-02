#!/usr/bin/env bash

set -e

source setenv.sh

rm -Rf dist
mkdir dist

cd ../ffmpeg

#Only perform the make clean beforehand if the configure script has been called before
if [ -f "config.mak" ]
then
    echo "Cleaning past configuration"
    make clean
fi

./configure \
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
    --enable-pthreads \
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
    --enable-encoder=pcm_f32be \
    --disable-decoders \
    --enable-decoder=pcm_f32be \
    --disable-hwaccels \
    --disable-muxers \
    --enable-muxer=mp4 \
    --enable-muxer=pcm_f32be \
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
    --cross-prefix=$FLASCC_BIN_PATH/ \
    --target-os=none \
\
    --disable-asm \
    --disable-fast-unaligned \
\
    --disable-debug \
    --disable-stripping

echo "Finished ffmpeg configuration"

make
make install
make clean

cd ../as3

make clean
make
make install
