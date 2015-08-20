# crossUserMedia #

crossUserMedia demonstrates how to use the HTML5 getUserMedia control and the Flash Microphone object for a cross browser audio file recorder.
The demo allows a user to record themselves using the microphone from a browser session, post to a server, and play back the sound as an mp4 encoded file.

Inspired the work of [Thibault Imbert](http://www.adobe.com/devnet/author_bios/thibault_imbert.html) on capturing microphone audio in [JavaScript](http://typedarray.org/from-microphone-to-wav-to-server/) and [ActionScript](http://www.bytearray.org/?p=1858)

## How It Works ##

## Building crossUserMedia ##

### Apache Flex Maven Dependencies ###

The Flash ActionScript widget can be compiled using Maven 3.1 or higher, but the Apache Flex SDK artifacts need to be 'mavenized' and installed into a maven repository.

The [Apache Flex Wiki](https://cwiki.apache.org/confluence/display/FLEX/Building+Flex+applications+with+Maven) has detailed instructions on how to do this for Flex 14.1 and flexmojos-maven-plugin 7.1.0-SNAPSHOT.

**Set up a working directory**
```
rm -Rf apacheflex
mkdir apacheflex
cd apacheflex
WORKING_DIR=`pwd`
```

**Get the Apache Flex Utilities and compile the converter**
```
cd $WORKING_DIR
git clone https://git-wip-us.apache.org/repos/asf/flex-utilities.git $WORKING_DIR/flex-utilities
cd $WORKING_DIR/flex-utilities
git checkout develop
cd $WORKING_DIR/flex-utilities/flex-maven-tools/flex-sdk-converter
mvn install
CONVERTER_JAR=$WORKING_DIR/flex-utilities/flex-maven-tools/flex-sdk-converter/cli/target/apache-flex-sdk-converter-1.0.0-SNAPSHOT.jar
```

**Use the Apache Flex Utilities to download the SDK**
```
cd $WORKING_DIR
FLEX_VERSION=4.14.1
FLASH_VERSIONS=14.0,15.0,16.0,17.0,18.0
AIR_VERSIONS=18.0
ACCEPT_LICENSE=-Dcom.adobe.systemIdsForWhichTheTermsOfTheAdobeLicenseAgreementAreAccepted=df3793c7
java $ACCEPT_LICENSE -jar $CONVERTER_JAR -flexVersion $FLEX_VERSION -flashVersions $FLASH_VERSIONS -airVersion $AIR_VERSIONS -platforms WINDOWS,MAC -fontkit -fdkDir fdk-dir download
```

**Mavenize the Apache Flex artifacts and install in a local directory**
```
cd $WORKING_DIR
java -jar $CONVERTER_JAR -fdkDir fdk-dir -mavenDir maven-dir convert
cp -R $WORKING_DIR/maven-dir/ ~/.m2/repository/
```
or if you have a private repository such as Nexus
```
java -jar $CONVERTER_JAR -mavenDir maven-dir -repoUrl http://____ -repoUsername ____ -repoPassword ____ deploy
```