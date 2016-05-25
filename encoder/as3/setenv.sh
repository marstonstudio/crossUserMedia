#!/usr/bin/env bash

#Switch the base variables based on the platform
case "$(uname -s)" in
    CYGWIN*) #On windows
        BASE_DIR=/cygdrive/c/EnglishCentral
        printf "Environment set for Windows platform.\nQuit if incorrect.\n"
        ;;
    Darwin) #On mac
        BASE_DIR=/usr/local
        printf "Environment set for Apple platform.\nQuit if incorrect.\n"
        ;;
    *)
        printf "Error: Running on an unsupported environment."
        exit 1
        ;;
esac

export FLASCC=$BASE_DIR/crossbridge/sdk
export FLEX=$BASE_DIR/air_sdk

export COMPC=$FLEX/bin/compc
export ASC2="java -jar $FLASCC/usr/lib/asc2.jar -merge -md -parallel"
export SWIG=$FLASCC/usr/bin/swig

export FLASCC_BIN_PATH=$FLASCC/usr/bin
