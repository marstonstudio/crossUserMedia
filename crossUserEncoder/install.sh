#!/usr/bin/env bash

rm -Rf dist
mkdir dist
cd ffmpeg
make clean

./configure  --prefix=../dist \
    --disable-ffplay --disable-ffprobe --disable-ffserver \
    --disable-doc --disable-iconv --disable-sdl --disable-securetransport \
    --disable-runtime-cpudetect --disable-asm \
    --disable-d3d11va --disable-dxva2 --disable-vaapi --disable-vda --disable-vdpau \
    --disable-encoders --enable-encoder=aac \
    --disable-decoders --enable-decoder=pcm_s16le \
    --disable-hwaccels \
    --disable-muxers --enable-muxer=adts \
    --disable-demuxers --enable-demuxer=wav \
    --disable-parsers \
    --disable-bsfs \
    --disable-protocols --enable-protocol=file \
    --disable-indevs \
    --disable-outdevs \
    --disable-filters --enable-filter=aresample

make && make install
make clean

ls -lha ../dist/bin/ffmpeg



