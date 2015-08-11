<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <link rel="stylesheet" type="text/css" href="styles.css">
    <script type="text/javascript" src="swfobject.js"></script>
    <script type="text/javascript" src="functions.js"></script>
</head>
<body onload="onLoad();">
    <div id="root">
        <div id="controlContainer" class="container">
            <div id="startButton" class="button" onclick="onClickStartRecording();">start</div>
            <div id="stopButton" class="button" onclick="onClickStopRecording();">stop</div>
        </div>
        <div id="flashContainer" class="container">
            <div id="crossUserMicrophone">Flash</div>
        </div>
        <div id="resultsContainer" class="container">
            <div id="sourceButton" class="button" onclick="onClickPlaySource();">source</div>
            <div id="outputButton" class="button" onclick="onClickPlayOutput();">output</div>
            <div id="downloadButton" class="button" onclick="onClickDownloadOutput();">download</div>
            <Audio id="outputAudio" />
            <Audio id="sourceAudio" />
        </div>
    </div>
</body>
</html>
