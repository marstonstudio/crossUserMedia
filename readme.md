
http://blog.bjornroche.com/2013/05/the-abcs-of-pcm-uncompressed-digital.html
http://www.actionscript.org/forums/showthread.php3?t=256774
http://www.jsresources.org/faq_audio.html

From microphone to .WAV with: getUserMedia and Web Audio
http://typedarray.org/from-microphone-to-wav-to-server/

MicRecorder, a tiny microphone library
http://www.bytearray.org/?p=1858

https://code.google.com/p/as3wavsound/


https://cwiki.apache.org/confluence/display/FLEX/Quick+Start+Guide%3A+Building+Apache+Flex+applications+using+Maven

https://cwiki.apache.org/confluence/display/FLEX/Building+Flex+applications+with+Maven

https://oss.sonatype.org/content/repositories/snapshots/net/flexmojos/oss/flexmojos-maven-plugin/7.1.0-SNAPSHOT/


rm -Rf flex-utilities
git clone https://git-wip-us.apache.org/repos/asf/flex-utilities.git
cd flex-utilities/flex-maven-tools/flex-sdk-converter
git checkout develop
mvn install

rm -Rf fdk-dir
java -jar apache-flex-sdk-converter.jar -flexVersion 4.14.1 -flashVersions 10.2,10.3,11.0,11.1,11.2,11.3,11.4,11.5,11.6,11.7,11.8,11.9,12.0,13.0,14.0,15.0,16.0,17.0,18.0 -airVersion 17.0 -platforms WINDOWS,MAC -fontkit -fdkDir fdk-dir -Dcom.adobe.systemIdsForWhichTheTermsOfTheAdobeLicenseAgreementAreAccepted=c9aae4bd download

rm -Rf maven-dir
java -jar apache-flex-sdk-converter.jar -fdkDir fdk-dir -mavenDir maven-dir convert

java -jar apache-flex-sdk-converter.jar -mavenDir maven-dir -repoUrl http://____/content/repositories/thirdparty -repoUsername ____ -repoPassword ____ deploy




