#!/usr/bin/env bash

rm -Rf out
mkdir out
cd ffmpeg
./configure  --prefix=../out
make