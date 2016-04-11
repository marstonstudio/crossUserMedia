package com.marstonstudio.crossusermedia.microphone.util {

    import flash.external.ExternalInterface;
    import flash.system.Capabilities;

    public class Console {

        public static function log(header:String, message:String):void {
            print(header, message, false);
        }

        public static function error(header:String, e:Error):void {
            var message:String = e.toString() + "\n" + e.getStackTrace().toString();
            print(header, message, true);
        }

        public static function logCapabilities(header:String):void {
            print(header, Capabilities.version + " " + Capabilities.playerType + ' isDebugger:' + Capabilities.isDebugger);
        }

        private static function print(header:String, message:String, err:Boolean = false):void {

            var traceOutput:String = header + " :: ";
            if(err) traceOutput += "ERROR :: ";
            traceOutput += message;
            trace(traceOutput);

            if(ExternalInterface.available) {
                ExternalInterface.call(err ? "console.error" : "console.log", header + " :: " + message);
            }
        }
    }
}
