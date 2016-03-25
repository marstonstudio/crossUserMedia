CC = emcc

CFLAGS = -v -O3 \
	-s OUTLINING_LIMIT=100000 \
	-s TOTAL_MEMORY=67108864 \
	-I./dist/include \
	--emit-symbol-map \
	--pre-js pre.js

LDFLAGS = -L./dist/lib

LDLIBS = -lm -lavdevice -lavformat -lavfilter -lavcodec -lswresample -lswscale -lavutil

#OBJECTS = ../c/transcode_aac.c
OBJECTS = dist/bin/ffmpeg.bc

INSTALL_DIR = ../../frontend/node_modules/encoderjs

all: program

program: $(OBJECTS)
	mkdir -p dist
	$(CC) $(CFLAGS) $(OBJECTS) -o dist/encoder.js $(LDFLAGS) $(LDLIBS)

install:
	mkdir -p $(INSTALL_DIR)
	cp -f ./.npmignore $(INSTALL_DIR)
	cp -f ./dist/encoder.* $(INSTALL_DIR)
	cp -f ./package.json $(INSTALL_DIR)
	cp -f ./README.md $(INSTALL_DIR)

clean:
	rm -f dist/encoder.*
	rm -Rf $(INSTALL_DIR)
