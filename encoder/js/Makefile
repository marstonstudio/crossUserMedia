CC = emcc

LDFLAGS = -L./dist/lib

LDLIBS = -lm -lavdevice -lavformat -lavfilter -lavcodec -lswresample -lswscale -lavutil

CFLAGS = -v -O3 \
	-I./dist/include \
	-s OUTLINING_LIMIT=100000 \
	-s TOTAL_MEMORY=67108864 \
	--emit-symbol-map \
	--pre-js pre.js

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
	rm -f dist/hello.*
	rm -Rf $(INSTALL_DIR)
