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

        import flash.display.DisplayObjectContainer;
        import flash.external.ExternalInterface;
        import flash.utils.ByteArray;

        import com.marstonstudio.crossusermedia.encoder.flascc.*;

        //TODO: get worker threads properly supported
        private var enableWorker:Boolean = false;

        private var output:ByteArray;

        public function Encoder(container:DisplayObjectContainer = null) {
            log("Encoder.as", "constructor", false);

            try {
                CModule.vfs.console = this;
                CModule.rootSprite = container ? container.root : null;
                if (CModule.canUseWorkers && CModule.rootSprite && enableWorker) {
                    CModule.startBackground(this, new <String>[], new <String>[]);
                } else {
                    CModule.startAsync(this, null, null, true, false);
                }
            } catch (e:*) {
                logException("Encoder.as", e);
                throw e;
            }
        }

        public function init(inputFormat:String, inputSampleRate:int, outputFormat:String, outputSampleRate:int, outputBitRate:int):void {
            com.marstonstudio.crossusermedia.encoder.flascc.init(inputFormat, inputSampleRate, outputFormat, outputSampleRate, outputBitRate);
        }

        public function load(input:ByteArray):void {
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