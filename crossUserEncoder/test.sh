#!/usr/bin/env bash

rm output.mp4
out/bin/ffmpeg -i input.wav -b:a 32k output.mp4 -strict -2