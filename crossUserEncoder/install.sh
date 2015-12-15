#!/usr/bin/env bash

rm -Rf out
mkdir out
cd ffmpeg
./configure  --prefix=../out --disable-ffplay --disable-ffprobe --disable-ffserver --disable-everything \
    --enable-encoder=aac --enable-decoder=aac --enable-encoder=pcm_s16le --enable-decoder=pcm_s16le \
    --enable-muxer=mp4 --enable-demuxer=mp4 --enable-muxer=wav --enable-demuxer=wav
make && make install
make clean



