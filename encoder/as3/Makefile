CC = $(FLASCC_BIN_PATH)/gcc

GROUP = com.marstonstudio.crossusermedia
PACKAGE = $(GROUP).encoder

SOURCES = ../c/encoder.c ../c/as3api.c
OBJECTS = dist/encoder_flascc.swc
TARGET = dist/encoder.swc

LDFLAGS = -L./dist/lib

LDLIBS = -lm -lavdevice -lavformat -lavfilter -lavcodec -lswresample -lswscale -lavutil

CFLAGS = -v -O2 \
	-I./dist/include \
	-emit-swc=$(PACKAGE).flascc

COMPFLAGS = \
	-include-libraries=$(OBJECTS) \
	-source-path=src \
	-include-classes $(PACKAGE).Encoder $(PACKAGE).events.EncoderEvent

################################################################

all: program

program: encoder
	$(COMPC) $(COMPFLAGS) -o $(TARGET)

encoder: prepare
	$(CC) $(CFLAGS) $(SOURCES) -o $(OBJECTS) $(LDFLAGS) $(LDLIBS)

prepare: checkenv
	mkdir -p dist

checkenv:
ifndef FLASCC
	$(error FLASCC is undefined. execute 'source setenv.sh' to define environment variables)
endif

install:
	mvn install:install-file \
		-Dfile=$(TARGET) \
		-DgroupId=$(GROUP) \
		-DartifactId=encoder \
		-Dversion=1.0-SNAPSHOT \
		-Dpackaging=swc \
		-DgeneratePom=true

clean:
	rm -f $(OBJECT)
	rm -f $(TARGET)
