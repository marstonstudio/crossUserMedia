#!/usr/bin/env bash

rm output.aac
dist/bin/ffmpeg -i input.wav -b:a 32k output.aac