package com.marstonstudio.crossusermedia.encoder {

    import com.marstonstudio.crossusermedia.encoder.flascc.vfs.*;

    public class Encoder implements ISpecialFile {

        import flash.display.Sprite;

        import com.marstonstudio.crossusermedia.encoder.flascc.*;

        public function Encoder(rootSprite:Sprite) {
        //public function Encoder() {
            trace("Encoder.as::constructor");

            CModule.vfs.console = this;
            CModule.rootSprite = rootSprite;
            //if(CModule.canUseWorkers) {
            //    CModule.startBackground(this, new <String>[], new <String>[]);
            //} else {
                CModule.startAsync(this);
            //}
        }

        public function init(i_format:String, i_sample_rate:int, o_format:String, o_sample_rate:int, o_bit_rate:int):void {
            com.marstonstudio.crossusermedia.encoder.flascc.init(i_format, i_sample_rate, o_format, o_sample_rate, o_bit_rate);
            
            /*
            var i_format_ptr:int = CModule.mallocString(i_format);
            CModule.writeString(i_format_ptr, i_format);

            var o_format_ptr:int = CModule.mallocString(o_format);
            CModule.writeString(o_format_ptr, o_format);

            com.marstonstudio.crossusermedia.encoder.flascc.init(i_format_ptr, i_sample_rate, o_format_ptr, o_sample_rate, o_bit_rate);
            
            CModule.free(i_format_ptr);
            CModule.free(o_format_ptr);
            */
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
            trace("Encoder.as::exit code:" + code);

            return exitHook ? exitHook(code) : false;
        }

        /**
         * The PlayerKernel implementation will use this function to handle
         * C IO write requests to the file "/dev/tty" (e.g. output from
         * printf will pass through this function). See the ISpecialFile
         * documentation for more information about the arguments and return value.
         */
        public function write(fd:int, buf:int, nbyte:int, errno_ptr:int):int
        {
            var str:String = CModule.readString(buf, nbyte);
            trace("encoder.c::" + str); // or display this string in a textfield somewhere?
            return nbyte;
        }

        /**
         * The PlayerKernel implementation will use this function to handle
         * C IO read requests to the file "/dev/tty" (e.g. reads from stdin
         * will expect this function to provide the data). See the ISpecialFile
         * documentation for more information about the arguments and return value.
         */
        public function read(fd:int, bufPtr:int, nbyte:int, errnoPtr:int):int
        {
            return 0
        }

        /**
         * The PlayerKernel implementation will use this function to handle
         * C fcntl requests to the file "/dev/tty"
         * See the ISpecialFile documentation for more information about the
         * arguments and return value.
         */
        public function fcntl(fd:int, com:int, data:int, errnoPtr:int):int
        {
            return 0
        }

        /**
         * The PlayerKernel implementation will use this function to handle
         * C ioctl requests to the file "/dev/tty"
         * See the ISpecialFile documentation for more information about the
         * arguments and return value.
         */
        public function ioctl(fd:int, com:int, data:int, errnoPtr:int):int
        {
            return 0
        }

    }

}