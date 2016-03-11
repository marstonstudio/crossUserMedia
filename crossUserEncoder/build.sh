#!/usr/bin/env bash

rm -Rf dist
mkdir dist

cd ffmpeg
emmake make clean

emconfigure ./configure \
    --prefix=../tmp \
\
    --disable-runtime-cpudetect \
\
    --disable-ffplay \
    --disable-ffprobe \
    --disable-ffserver \
\
    --disable-doc \
\
    --disable-pthreads \
    --disable-w32threads \
    --disable-os2threads \
\
    --disable-d3d11va \
    --disable-dxva2 \
    --disable-vaapi \
    --disable-vda \
    --disable-vdpau \
\
    --disable-encoders \
    --enable-encoder=aac \
    --disable-decoders \
    --enable-decoder=pcm_f32be \
    --enable-decoder=pcm_f32le \
    --disable-hwaccels \
    --disable-muxers \
    --enable-muxer=mp4 \
    --disable-demuxers \
    --enable-demuxer=pcm_f32be \
    --enable-demuxer=pcm_f32le \
    --disable-parsers \
    --disable-bsfs \
    --disable-protocols \
    --enable-protocol=file \
    --enable-protocol=pipe \
    --disable-indevs \
    --disable-outdevs \
    --disable-filters \
    --enable-filter=aresample \
\
    --disable-iconv \
    --disable-sdl \
    --disable-securetransport \
    --disable-xlib \
\
    --arch=x86_32 \
    --cpu=generic \
    --enable-cross-compile \
    --target-os=none \
    --cross-prefix=em \
    --cc=emcc \
\
    --disable-asm \
    --disable-fast-unaligned \
\
    --disable-debug \
    --disable-stripping

emmake make

cd ..
cp ffmpeg/ffmpeg dist/ffmpeg.bc


sed -e '\/\*EMSCRIPTENBODY\*\//,$d' wrapper.js > dist/pre.js
sed -e '1,\/\*EMSCRIPTENBODY\*\//d' wrapper.js > dist/post.js

emcc -O3 -s OUTLINING_LIMIT=100000 -s TOTAL_MEMORY=67108864 dist/ffmpeg.bc --pre-js dist/pre.js --post-js dist/post.js -o dist/ffmpegaac.js
#emcc -O0 tmp/ffmpeg.bc --pre-js tmp/pre.js --post-js tmp/post.js -o ffmpegaac.js

#npm test

LOCAL_INSTALL_TARGET=../crossUserFrontend/node_modules/ffmpegaac
rm -Rf $LOCAL_INSTALL_TARGET
mkdir $LOCAL_INSTALL_TARGET
cp ./.npmignore $LOCAL_INSTALL_TARGET
cp ./dist/ffmpegaac.js $LOCAL_INSTALL_TARGET
cp ./dist/ffmpegaac.js.mem $LOCAL_INSTALL_TARGET
cp ./package.json $LOCAL_INSTALL_TARGET
cp ./README.md $LOCAL_INSTALL_TARGET
