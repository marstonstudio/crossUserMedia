#!/usr/bin/env bash

rm -Rf ../dist
mkdir ../dist

sed -e '\/\*EMSCRIPTENBODY\*\//,$d' hello.js > ../dist/pre.js
sed -e '1,\/\*EMSCRIPTENBODY\*\//d' hello.js > ../dist/post.js

emcc hello.c -o ../dist/index.js --pre-js ../dist/pre.js --post-js ../dist/post.js
