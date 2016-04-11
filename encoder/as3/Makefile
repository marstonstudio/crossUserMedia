CC = gcc

GROUP = com.marstonstudio.crossusermedia
PACKAGE = $(GROUP).encoder

OBJECTS_CC = ../c/encoder.c ../c/as3api.c
TARGET_CC = dist/encoder_flascc.swc

OBJECTS_LIB = $(PACKAGE).Encoder
TARGET_LIB = dist/encoder.swc

LDFLAGS = -L./dist/lib

LDLIBS = -lm -lavdevice -lavformat -lavfilter -lavcodec -lswresample -lswscale -lavutil

CFLAGS = -v \
	-I./dist/include \
	-pthread \
	-emit-swc=$(PACKAGE).flascc

all: program

program: $(OBJECTS_CC)

	mkdir -p dist

	$(CC) $(CFLAGS)  $(OBJECTS_CC) -o $(TARGET_CC) $(LDFLAGS) $(LDLIBS)

	$(COMPC) \
		-include-libraries=$(TARGET_CC) \
		-source-path=src -include-classes $(OBJECTS_LIB) \
		-o $(TARGET_LIB)

install:
	mvn install:install-file -Dfile=$(TARGET_LIB) \
		-DgroupId=$(GROUP) \
		-DartifactId=encoder \
		-Dversion=1.0-SNAPSHOT \
		-Dpackaging=swc \
		-DgeneratePom=true

clean:
	rm -f ../c/encoder_wrap.c
	rm -f dist/*.swc
	rm -f dist/*.as
	rm -f dist/*.abc
