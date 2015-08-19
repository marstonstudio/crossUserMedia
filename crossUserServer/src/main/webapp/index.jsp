<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <link rel="stylesheet" type="text/css" href="styles.css">
</head>
<body>
<div id="root" ng-app="Microphone" ng-controller="MicrophoneController as microphone">
    <div id="controlContainer" class="container">
        <div id="startButton" class="button" ng-click="microphone.startRecording();">start</div>
        <div id="stopButton" class="button" ng-click="microphone.stopRecording();">stop</div>
    </div>
    <div id="flashContainer" class="container ng-hide" ng-show="microphone.flashMode">
        <div id="crossUserMicrophone">Flash</div>
    </div>
    <div id="resultsContainer" class="container">
        <div
                id="sourceButton"
                class="button ng-hide"
                ng-show="microphone.showSourceAudioButton"
                ng-click="microphone.playSource();">
            source
        </div>
        <div
                id="outputButton"
                class="button ng-hide"
                ng-show="microphone.showOutputAudioButton"
                ng-click="microphone.playOutput();">
            output
        </div>
        <div id="downloadButton" class="button" onclick="onClickDownloadOutput();">download</div>
        <Audio id="outputAudio"></Audio>
        <Audio id="sourceAudio"></Audio>
    </div>
</div>
<script type="text/javascript">
    var CONFIG = {};
</script>
<script type="text/javascript" src="js/libs/swfobject.js"></script>
<script type="text/javascript" src="js/libs/angular.min.js"></script>
<script type="text/javascript" src="js/applets/microphone/App.js"></script>
<script type="text/javascript" src="js/applets/microphone/controllers/MicrophoneController.js"></script>
<script type="text/javascript" src="js/applets/microphone/factories/FlashRecordingFactory.js"></script>
<script type="text/javascript" src="js/applets/microphone/factories/NativeRecordingFactory.js"></script>
<script type="text/javascript" src="js/applets/microphone/factories/NavigatorFactory.js"></script>
<script type="text/javascript" src="js/applets/microphone/factories/UploadFactory.js"></script>

</body>
</html>
