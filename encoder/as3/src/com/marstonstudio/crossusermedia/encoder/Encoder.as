package com.marstonstudio.crossusermedia.encoder {

    import com.marstonstudio.crossusermedia.encoder.flascc.vfs.*;
    import com.marstonstudio.crossusermedia.encoder.events.EncoderEvent;

    /**
     * Wrapper for the flascc compiled FFMPEG encoder which handles CModule interactions
     *
     * @see http://www.adobe.com/devnet-docs/flascc/docs/Reference.html
     * @see https://www.adobe.com/devnet-docs/flascc/docs/apidocs/package-summary.html
     * @see https://www.adobe.com/devnet-docs/flascc/docs/capidocs/as3.html
     * @see https://github.com/crossbridge-community/crossbridge/blob/master/samples/06_SWIG/PassingData/PassData.as
     */
    public class Encoder implements ISpecialFile {

        import flash.display.Sprite;
        import flash.external.ExternalInterface;
        import flash.utils.ByteArray;

        import com.marstonstudio.crossusermedia.encoder.flascc.*;

        // TODO: get worker threads properly supported
        // @see http://www.adobe.com/devnet/games/articles/pthreads-flascc.html
        // @see http://help.adobe.com/en_US/FlashPlatform/reference/actionscript/3/flash/system/Worker.html
        private var enableWorker:Boolean = false;

        private var loadQueue:Vector.<ByteArray>;

        private var loadCalls:int = 0;

        public function Encoder(container:Sprite = null) {
            log("Encoder.as", "constructor", false);

            var args:Vector.<String> = new <String>[];
            var env:Vector.<String> = new <String>[];

            try {
                CModule.vfs.console = this;
                CModule.rootSprite = container;
                if (CModule.canUseWorkers && CModule.rootSprite && enableWorker) {
                    log("Encoder.as", "using workers");
                    CModule.startBackground(this, args, env, 65536);
                } else {
                    CModule.startAsync(this, args, env, true);
                }
            } catch (e:*) {
                logException("Encoder.as", e);
                throw e;
            }
        }

        public function init(inputFormat:String, inputCodec:String, inputSampleRate:int, inputChannels:int, outputFormat:String, outputCodec:String, outputSampleRate:int, outputChannels:int, outputBitRate:int, outputBufferMaxSeconds:int):void {
            loadQueue = new <ByteArray>[];
            loadCalls = 0;

            var status:int = com.marstonstudio.crossusermedia.encoder.flascc.init(inputFormat, inputCodec, inputSampleRate, inputChannels, outputFormat, outputCodec, outputSampleRate, outputChannels, outputBitRate, outputBufferMaxSeconds);
        }

        public function load(inputAudioBytes:ByteArray = null):void {
            if(inputAudioBytes == null) inputAudioBytes = new ByteArray();
            
            log('Encoder.as', 'load length:' + inputAudioBytes.length + ', loadQueue.length:' + loadQueue.length + ', calls:' + ++loadCalls);
            loadQueue.push(inputAudioBytes);
            executeLoad();
        }

        private function executeLoad():void {
            
            var loadLocked:Boolean = (com.marstonstudio.crossusermedia.encoder.flascc.getLoadLockedStatus() == 1);
            log('Encoder.as', 'executeLoad() loadLocked:' + loadLocked + ', loadQueue.length:' + loadQueue.length);
            if(!loadLocked && loadQueue.length > 0) {
                var inputAudioBytes:ByteArray = loadQueue.shift();
                var inputLength:int = inputAudioBytes.length;
                var inputPointer:int = CModule.malloc(inputLength);
                CModule.writeBytes(inputPointer, inputLength, inputAudioBytes);

                var status:int = -1;
                try {
                    status = com.marstonstudio.crossusermedia.encoder.flascc.loadPointer(inputPointer, inputLength);
                } catch (e:*) {
                    logException("Encoder.as", e);
                }

                //was in fact loadLocked, put the inputAudio back
                if(status == 1) {
                    loadQueue.unshift(inputAudioBytes);

                //called with inputAudioBytes.length==0 to trigger flush   
                } else if(inputLength == 0) {
                    executeFlushComplete();
                    
                //more that we need to load    
                } else {
                    if(loadQueue.length > 0) {
                        executeLoad();
                    }
                }

                CModule.free(inputPointer);
            }
            
        }
        
        private function executeFlushComplete():void {
            log("Encoder.as", "executeFlushComplete");

            CModule.rootSprite.dispatchEvent(new EncoderEvent(EncoderEvent.COMPLETE, getOutput(), getOutputFormat(), getOutputCodec(), getOutputSampleRate(), getOutputChannels()));
        }
        
        public function getOutput():ByteArray {
            var outputPointer:int = com.marstonstudio.crossusermedia.encoder.flascc.getOutputPointer();
            var outputLength:int = com.marstonstudio.crossusermedia.encoder.flascc.getOutputLength();

            var outputAudio:ByteArray = new ByteArray();
            CModule.readBytes(outputPointer, outputLength, outputAudio);
            outputAudio.position = 0;
            return outputAudio;
        }

        public function getOutputFormat():String {
            return com.marstonstudio.crossusermedia.encoder.flascc.getOutputFormat();
        }

        public function getOutputCodec():String {
            return com.marstonstudio.crossusermedia.encoder.flascc.getOutputCodec();
        }

        public function getOutputSampleRate():int {
            return com.marstonstudio.crossusermedia.encoder.flascc.getOutputSampleRate();
        }

        public function getOutputChannels():int {
            return com.marstonstudio.crossusermedia.encoder.flascc.getOutputChannels();
        }
        
        public function dispose(status:int):void {
            try {
                com.marstonstudio.crossusermedia.encoder.flascc.dispose(status);
            } catch(e:com.marstonstudio.crossusermedia.encoder.flascc.Exit) {
                //expected Exit not an actual Exception
            }
            CModule.dispose();
        } 

        /**
         * The callback to call when FlasCC code calls the posix exit() function. Leave null to exit silently.
         * @private
         */
        public var exitHook:Function;

        /**
         * The PlayerKernel implementation will use this function to handle
         * C process exit requests
         */
        public function exit(code:int):Boolean {
            log("Encoder.as", "exit (" + code +")");

            return exitHook ? exitHook(code) : false;
        }

        /**
         * The PlayerKernel implementation will use this function to handle
         * C IO write requests to the file "/dev/tty" (e.g. output from
         * printf will pass through this function). See the ISpecialFile
         * documentation for more information about the arguments and return value.
         */
        public function write(fd:int, buf:int, nbyte:int, errno_ptr:int):int {
            if(nbyte > 1) {
                var str:String = CModule.readString(buf, nbyte - 1);
                log("encoder.c", str, fd == 2);
            }
            return nbyte;
        }

        /**
         * The PlayerKernel implementation will use this function to handle
         * C IO read requests to the file "/dev/tty" (e.g. reads from stdin
         * will expect this function to provide the data). See the ISpecialFile
         * documentation for more information about the arguments and return value.
         */
        public function read(fd:int, bufPtr:int, nbyte:int, errnoPtr:int):int {
            return 0
        }

        /**
         * The PlayerKernel implementation will use this function to handle
         * C fcntl requests to the file "/dev/tty"
         * See the ISpecialFile documentation for more information about the
         * arguments and return value.
         */
        public function fcntl(fd:int, com:int, data:int, errnoPtr:int):int {
            return 0
        }

        /**
         * The PlayerKernel implementation will use this function to handle
         * C ioctl requests to the file "/dev/tty"
         * See the ISpecialFile documentation for more information about the
         * arguments and return value.
         */
        public function ioctl(fd:int, com:int, data:int, errnoPtr:int):int {
            return 0
        }



        private function log(header:String, message:String, err:Boolean = false):void {
            
            var traceOutput:String = header + " :: ";
            if(err) traceOutput += "ERROR :: ";
            traceOutput += message;
            trace(traceOutput);

            if(ExternalInterface.available) {
                ExternalInterface.call(err ? "console.error" : "console.log", header + " :: " + message);
            }
        }

        private function logException(header:String, e:*):void {
            log(header, e.toString() + "\n" + e.getStackTrace().toString(), true);
        }

    }

}