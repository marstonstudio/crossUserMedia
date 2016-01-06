#!/usr/bin/env bash

rm output.mp4
dist/bin/ffmpeg -i input.wav -b:a 32k -strict -2 output.mp4
