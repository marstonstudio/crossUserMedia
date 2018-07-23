#!/usr/bin/env bash

mvn install:install-file \
    -Dfile=xuggler-5.4.jar \
    -DgroupId=com.xuggle \
    -DartifactId=xuggle-xuggler \
    -Dversion=5.4 \
    -Dpackaging=jar \
    -DgeneratePom=true
