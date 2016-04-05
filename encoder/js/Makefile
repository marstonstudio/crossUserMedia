CC = emcc

LDFLAGS = -L./dist/lib

LDLIBS = -lm -lavdevice -lavformat -lavfilter -lavcodec -lswresample -lswscale -lavutil

CFLAGS = -v -O0 \
	-I./dist/include \
	-s OUTLINING_LIMIT=100000 \
	-s TOTAL_MEMORY=67108864 \
	-s EXPORTED_FUNCTIONS="['_main', '_init', '_load', '_flush', '_get_output_sample_rate', '_get_output_format', '_get_output_length', '_force_exit']" \
	--emit-symbol-map \
	--pre-js pre.js \
	--post-js post.js

#OBJECTS = ../simple.c
OBJECTS = ../c/encoder.c
#OBJECTS = dist/bin/ffmpeg.bc

TARGET = dist/encoder.js

INSTALL_DIR = ../../frontend/node_modules/encoderjs

all: program

program: $(OBJECTS)
	mkdir -p dist
	$(CC) $(CFLAGS) $(OBJECTS) -o $(TARGET) $(LDFLAGS) $(LDLIBS)

install:
	mkdir -p $(INSTALL_DIR)
	cp -f ./.npmignore $(INSTALL_DIR)
	cp -f ./dist/encoder.* $(INSTALL_DIR)
	cp -f ./package.json $(INSTALL_DIR)
	cp -f ./README.md $(INSTALL_DIR)

clean:
	rm -f dist/encoder.*
	rm -Rf $(INSTALL_DIR)
