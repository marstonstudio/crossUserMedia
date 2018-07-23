CC = emcc

SOURCES = ../c/encoder.c
TARGET = dist/encoder.js
INSTALL_DIR = ../../frontend/node_modules/pcmencoder

LDFLAGS = -L./dist/lib

LDLIBS = -lm -lavdevice -lavfilter -lavformat -lavcodec -lswresample -lswscale -lavutil -lz

# https://github.com/kripken/emscripten/blob/master/src/settings.js
# https://kripken.github.io/emscripten-site/docs/optimizing/Optimizing-Code.html
# https://kripken.github.io/emscripten-site/docs/porting/Debugging.html
# more debugging: --emit-symbol-map -g -g4
#export EMCC_DEBUG=0

CFLAGS = -v -O3 \
	-I./dist/include \
	-s OUTLINING_LIMIT=10000 \
	-s TOTAL_MEMORY=16777216 \
	-s NO_EXIT_RUNTIME=1 \
	-s EXPORTED_FUNCTIONS="['_main', '_init', '_load', '_get_output_format', '_get_output_codec', '_get_output_sample_rate', '_get_output_channels', '_get_output_pointer', '_get_output_length', '_get_load_locked_status', '_dispose']" \
	-s EXTRA_EXPORTED_RUNTIME_METHODS='[ccall'] \
	--pre-js pre.js \
	--post-js post.js

ifeq ($(FORMAT), wasm)
	FORMATFLAGS = -s BINARYEN=1 -s BINARYEN_TRAP_MODE="'clamp'"
else
	FORMATFLAGS = -s BINARYEN=0 --memory-init-file 1
endif

################################################################

all: program

program: prepare
	$(CC) $(CFLAGS) $(FORMATFLAGS) $(SOURCES) -o $(TARGET) $(LDFLAGS) $(LDLIBS)

prepare:
	mkdir -p dist

install:
	mkdir -p $(INSTALL_DIR)
	cp -f ./.npmignore $(INSTALL_DIR)
	cp -f ./dist/encoder.* $(INSTALL_DIR)
	cp -f ./package.json $(INSTALL_DIR)
	cp -f ./README.md $(INSTALL_DIR)

clean:
	rm -f ./dist/encoder.*
	rm -Rf $(INSTALL_DIR)
