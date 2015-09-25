#!/usr/bin/env bash

echo "FLASCC: $FLASCC"
echo "FLEX: $FLEX"
echo "JAVA_HOME: $JAVA_HOME"
echo "======================="

$FLASCC/usr/bin/make clean -f CrossbridgeMakefile.txt
$FLASCC/usr/bin/make FLASCC="$FLASCC" FLEX="$FLEX" -f CrossbridgeMakefile.txt
exit