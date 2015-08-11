function onLoad() {
    console.log("onLoad");

    initializeUserMedia();
    if (!navigator.getUserMedia) {
        initializeFlash();
    } else {
        document.getElementById("flashContainer").style.display = "none";
    }

    document.getElementById("sourceButton").style.display = "none";
    document.getElementById("outputButton").style.display = "none";
    document.getElementById("downloadButton").style.display = "none";
}

function initializeUserMedia() {
    if (!navigator.getUserMedia) {
        navigator.getUserMedia =
            navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia ||
            navigator.msGetUserMedia;
    }
}

function initializeFlash() {
    var flashvars = {};
    var params = {
        id: "crossUserMicrophoneSwf"
    };
    var attributes = {
        id: "crossUserMicrophoneSwf"
    };
    swfobject.embedSWF("crossUserMicrophone.swf", "crossUserMicrophone", "310", "138", "14.0.0", "expressInstall.swf", flashvars, params, attributes);
}

function onClickStartRecording() {
    console.log("onClickStartRecording");
    if (navigator.getUserMedia) {
        navigator.getUserMedia({audio: true}, startUserMediaRecording, function (e) {
            console.error(e.message);
        });
    } else {
        document.getElementById("crossUserMicrophoneSwf").startRecording();
    }
}

function onClickStopRecording() {
    console.log("onClickStopRecording");
    if (navigator.getUserMedia) {
        stopUserMediaRecording();
    } else {
        document.getElementById("crossUserMicrophoneSwf").stopRecording();
    }
}

function onClickPlaySource() {
    console.log("onClickPlaySource");
    document.getElementById("sourceAudio").play();
}

function onClickPlayOutput() {
    console.log("onClickPlayOutput " + outputUrl);
    document.getElementById("outputAudio").play();
}

// http://pixelscommander.com/en/javascript/javascript-file-download-ignore-content-type/
function onClickDownloadOutput() {
    console.log("onClickDownloadOutput " + outputUrl);

    //If in Chrome or Safari - download via virtual link click
    if (navigator.userAgent.toLowerCase().indexOf('chrome') > -1 ||
        navigator.userAgent.toLowerCase().indexOf('safari') > -1
    ) {
        //Creating new link node.
        var link = document.createElement('a');
        link.href = outputUrl;

        if (link.download !== undefined){
            //Set HTML5 download attribute. This will prevent file from opening if supported.
            var fileName = outputUrl.substring(outputUrl.lastIndexOf('/') + 1, outputUrl.length);
            link.download = fileName;
        }

        //Dispatching click event.
        if (document.createEvent) {
            var e = document.createEvent('MouseEvents');
            e.initEvent('click' ,true ,true);
            link.dispatchEvent(e);
            return true;
        }
    }

    // Force file download (whether supported by server).
    var query = '?download';

    window.open(outputUrl + query, "_blank");
}

///////////////////////////////

var leftchannel = [];
var rightchannel = [];
var recordingLength = 0;
var volume = null;
var sampleRate = null;
var audioStream = null;
var context = null;
var recorder = null;
var audioInput = null;
var inputFormat = "wav";
var outputFormat = "mp4";
var outputUrl = null;

function startUserMediaRecording(stream) {

    leftchannel.length = rightchannel.length = 0;
    recordingLength = 0;

    audioStream = stream;

    // creates the audio context
    var audioContext = window.AudioContext || window.webkitAudioContext;
    context = new audioContext();

    // retrieve the current sample rate to be used for WAV packaging
    sampleRate = context.sampleRate;

    // creates a gain node
    volume = context.createGain();

    // creates an audio node from the microphone incoming stream
    audioInput = context.createMediaStreamSource(audioStream);

    // connect the stream to the gain node
    audioInput.connect(volume);

    /* From the spec: This value controls how frequently the audioprocess event is
     dispatched and how many sample-frames need to be processed each call.
     Lower values for buffer size will result in a lower (better) latency.
     Higher values will be necessary to avoid audio breakup and glitches */
    var bufferSize = 2048;
    recorder = context.createScriptProcessor(bufferSize, 2, 2);

    recorder.onaudioprocess = function(e){
        console.log ('recording');
        var left = e.inputBuffer.getChannelData (0);
        var right = e.inputBuffer.getChannelData (1);
        // we clone the samples
        leftchannel.push (new Float32Array (left));
        rightchannel.push (new Float32Array (right));
        recordingLength += bufferSize;
    }

    // we connect the recorder
    volume.connect (recorder);
    recorder.connect (context.destination);
}

function stopUserMediaRecording() {

    if(audioInput) audioInput.disconnect();
    if(audioStream) audioStream.stop();
    if(recorder) recorder.onaudioprocess = null;

    // we flat the left and right channels down
    //var leftBuffer = mergeBuffers ( leftchannel, recordingLength );
    //var rightBuffer = mergeBuffers ( rightchannel, recordingLength );
    // we interleave both channels together
    //var outputBuffer = interleave ( leftBuffer, rightBuffer );

    var outputBuffer = mergeBuffers ( leftchannel, recordingLength );
    var channelCount = 1;
    var bitsPerSample = 16;

    // we create our wav file
    var buffer = new ArrayBuffer(44 + outputBuffer.length * 2);
    var view = new DataView(buffer);

    // RIFF chunk descriptor
    writeUTFBytes(view, 0, 'RIFF');
    view.setUint32(4, 44 + outputBuffer.length * 2, true);
    writeUTFBytes(view, 8, 'WAVE');
    // FMT sub-chunk
    writeUTFBytes(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channelCount, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * channelCount * bitsPerSample / 8, true);
    view.setUint16(32, channelCount * bitsPerSample / 8, true);
    view.setUint16(34, bitsPerSample, true);
    // data sub-chunk
    writeUTFBytes(view, 36, 'data');
    view.setUint32(40, outputBuffer.length * 2, true);

    // write the PCM samples
    var lng = outputBuffer.length;
    var index = 44;
    var volume = 1;
    for (var i = 0; i < lng; i++){
        view.setInt16(index, outputBuffer[i] * (0x7FFF * volume), true);
        index += 2;
    }

    // our final binary blob
    var audioBlob = new Blob ( [ view ], { type : 'audio/wav' } );
    embedLocalBlob(audioBlob);
    uploadToServer(audioBlob);
}

function mergeBuffers(channelBuffer, recordingLength){
    var result = new Float32Array(recordingLength);
    var offset = 0;
    var lng = channelBuffer.length;
    for (var i = 0; i < lng; i++){
        var buffer = channelBuffer[i];
        result.set(buffer, offset);
        offset += buffer.length;
    }
    return result;
}

function interleave(leftChannel, rightChannel){
    var length = leftChannel.length + rightChannel.length;
    var result = new Float32Array(length);

    var inputIndex = 0;

    for (var index = 0; index < length; ){
        result[index++] = leftChannel[inputIndex];
        result[index++] = rightChannel[inputIndex];
        inputIndex++;
    }
    return result;
}

function writeUTFBytes(view, offset, string){
    var lng = string.length;
    for (var i = 0; i < lng; i++){
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

function onFlashSoundRecorded(audioBase64) {
    console.log("onSoundRecorded length:" + audioBase64.length);

    var audioBlob = b64toBlob(audioBase64, 'audio/wav');
    embedLocalBlob(audioBlob);
    uploadToServer(audioBlob);
}

function embedLocalBlob(audioBlob) {
    console.log("embedLocalBlob");

    var audioUrl = URL.createObjectURL(audioBlob);
    document.getElementById("sourceAudio").src = audioUrl;
    document.getElementById("sourceButton").innerHTML = "play base64 source";// (" + document.getElementById("sourceAudio").duration + " sec)";
    document.getElementById("sourceButton").style.display = "block";
}

function uploadToServer(audioBlob) {
    console.log("uploadToServer");

    var formData = new FormData();
    formData.append("payload", audioBlob);
    formData.append("inputFormat", inputFormat);
    formData.append("outputFormat", outputFormat);

    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("POST", "/rest/audio", true);
    xmlhttp.onreadystatechange = function() {

        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            outputUrl = xmlhttp.responseText;
            console.log("upload response " + outputUrl);

            document.getElementById("outputAudio").src = outputUrl;
            document.getElementById("outputButton").innerHTML = "play processed output";// (" + document.getElementById("outputAudio").duration + " sec)";
            document.getElementById("outputButton").style.display = "block";
            document.getElementById("downloadButton").innerHTML = "download " + outputFormat + " file";
            document.getElementById("downloadButton").style.display = "block";
        }
    }
    xmlhttp.send(formData);
}

function b64toBlob(b64Data, contentType, sliceSize) {
    contentType = contentType || '';
    sliceSize = sliceSize || 512;

    var byteCharacters = atob(b64Data);
    var byteArrays = [];

    for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        var slice = byteCharacters.slice(offset, offset + sliceSize);

        var byteNumbers = new Array(slice.length);
        for (var i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        var byteArray = new Uint8Array(byteNumbers);

        byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, {type: contentType});
}