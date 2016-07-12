# Flex Microphone #

The Flex Microphone component is for microphone support of Internet Explorer and Safari.

## Mavenizing Apache Flex ##

The Flash ActionScript widget can be compiled using Maven 3.3 or higher, but the Apache Flex SDK artifacts need to be 'mavenized' and installed into a maven repository.

The [Apache Flex Wiki](https://cwiki.apache.org/confluence/display/FLEX/Building+Flex+applications+with+Maven) has detailed instructions on how to do this for Flex 14.1 and flexmojos-maven-plugin 7.1.0.

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

## If using IntelliJ ##

IntelliJ works well for compiling and working with the Flex code, however there are two configuration changes that are worth doing.
Both additions are placed in ```File->Project Structure->Modules->microphone->Compiler Options->Additional compiler options```

* As of 9/25/2015, [IntelliJ has a problem compiling CFF fonts](http://apache-flex-users.2333346.n4.nabble.com/Flex-Mojos-Fonts-and-Theme-Questions-tc10999.html).
In order to build in IntelliJ, you must add a compiler override option which will disable the font embedding.
```-define+=CONFIG::cffFont,false```

* Setting the output of IntelliJ Flex builds to be inside the Java project makes it easier to trigger updates in the development envrionment.
Replace ```~``` with the absolute local filesystem path. The downside of this is that the IntelliJ FlexUnit test runner will no longer work.
```-output=~/crossUserMedia/server/target/server/swf/microphone.swf```

-output=/Users/jon/Workspace/github/crossUserMedia/server/target/server/swf/microphone.swf
