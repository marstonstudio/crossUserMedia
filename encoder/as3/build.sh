#!/usr/bin/env bash

export FLASCC=/usr/local/crossbridge/sdk
export FLEX=/usr/local/air_sdk

export COMPC=$FLEX/bin/compc
export ASC2="java -jar $FLASCC/usr/lib/asc2.jar -merge -md -parallel"
export SWIG=$FLASCC/usr/bin/swig

PATH=$FLASCC/usr/bin:$PATH

make clean
make
make install
