package com.marstonstudio.crossusermedia.encoder {

    import com.marstonstudio.crossusermedia.encoder.flascc.vfs.*;

    /**
     * Wrapper for the flascc compiled FFMPEG encoder which handles CModule interactions
     *
     * @see http://www.adobe.com/devnet-docs/flascc/docs/Reference.html
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

        private var output:ByteArray;

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

        public function init(inputFormat:String, inputCodec:String, inputSampleRate:int, inputChannels:int, outputCodec:String, outputFormat:String, outputSampleRate:int, outputChannels:int, outputBitRate:int):void {
           
            com.marstonstudio.crossusermedia.encoder.flascc.init(inputFormat, inputCodec, inputSampleRate, inputChannels, outputCodec, outputFormat, outputSampleRate, outputChannels, outputBitRate);

        }

        public function load(input:ByteArray):void {
            //Convert the input byte array into a C friendly type with its length
            var inputLength:int = input.length;
            var inputPointer:int = CModule.malloc(inputLength);
            CModule.writeBytes(inputPointer, inputLength, input);
            
            com.marstonstudio.crossusermedia.encoder.flascc.loadPointer(inputPointer, inputLength);

            CModule.free(inputPointer);
        }
        
        public function flush():ByteArray {
            var outputPointer:int = com.marstonstudio.crossusermedia.encoder.flascc.flushPointer();
            var outputLength:int = com.marstonstudio.crossusermedia.encoder.flascc.getOutputLength();
            output = new ByteArray();
            CModule.readBytes(outputPointer, outputLength, output);
            return output;
        }

        public function getOutputSampleRate():int {
            return com.marstonstudio.crossusermedia.encoder.flascc.getOutputSampleRate();
        }

        public function getOutputFormat():String {
            return com.marstonstudio.crossusermedia.encoder.flascc.getOutputFormat();
        }

        public function getOutputLength():int {
            return com.marstonstudio.crossusermedia.encoder.flascc.getOutputLength();
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