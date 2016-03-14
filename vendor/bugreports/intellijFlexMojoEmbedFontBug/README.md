# Unable to embed fonts using FlexMojo and IntelliJ

Intellij 14.1 encounters an error using embedded fonts using CFF and Flex Mojos.

When importing projects into IntelliJ using Apache Flex 14.1 and Flex Mojos 7.1.0-SNAPSHOT,
IntelliJ appears not to properly use the fontkit dependency to embed CFF font formats such as *.otf.

The attached test case compiles correctly using Maven, but IntelliJ throws an error
```
Error:(16, 0) [intellijFlexMojoEmbedFontBug]: exception during transcoding:
Error:(16, 9) [intellijFlexMojoEmbedFontBug]: unable to build font 'SourceSansPro'
Error:(16, 9) [intellijFlexMojoEmbedFontBug]: Unable to transcode SourceSansPro-Regular.otf.
```

Same syntax works correctly using *.ttf font files, but IntelliJ appears to be using JREFontManager or BatikFontManager.

In an [email thread with current Flex Mojos maintainer Christopher Dutz](http://apache-flex-users.2333346.n4.nabble.com/Flex-Mojos-Fonts-and-Theme-Questions-tc10999.html), he suggests the bug may be due to IntelliJ using only one Flex artifact instead of 3.

Note that in order to compile this test case in either IntelliJ or Maven, you must first 'mavenize' the Apache Flex framework including fontkit. See [my instructions](https://github.com/marstonstudio/crossUserMedia/blob/master/README.md) or [official wiki](https://cwiki.apache.org/confluence/display/FLEX/Building+Flex+applications+with+Maven).

Resolution would be for IntelliJ to properly encode *.otf fonts for newer Flex Mojos projects.

Issue tracked with Jetbrains as [IDEA-144541](https://youtrack.jetbrains.com/issue/IDEA-144541)
