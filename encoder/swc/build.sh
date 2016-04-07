#!/usr/bin/env bash

export FLASCC=/usr/local/crossbridge/sdk
export FLEX=/usr/local/air_sdk
export ASC2="java -jar $FLASCC/usr/lib/asc2.jar -merge -md -parallel"

PATH=$FLASCC/usr/bin:$PATH

make clean
make
make install
