#!/bin/sh

#This hook is called before each and every git commit

# Run through the entire directory tree and pass every file through
# `dos2unix` (if that command exists) in order to standardize the
# files to a common unix format
if hash dos2unix 2>/dev/null;
then
    find . -type f -not -path "./encoder/ffmpeg/*" -not -path "./.git/*" -print0 | xargs -0 -n 1 -P 4 dos2unix
fi

