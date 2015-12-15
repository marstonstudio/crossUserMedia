#!/usr/bin/env bash

rm -Rf out
mkdir out
cd ffmpeg
./configure  --prefix=../out --disable-ffplay --disable-ffprobe --disable-ffserver
make && make install
make clean



