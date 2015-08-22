package com.marstonstudio.crossUserServer.util {

    import flash.external.ExternalInterface;
    import flash.system.Capabilities;

    public class Console {

        public static function log(message:String):void {
            ExternalInterface.call("console.log", message);
        }

        public static function logCapabilities():void {
            log(Capabilities.version + " " + Capabilities.playerType + " isDebugger:" + Capabilities.isDebugger);
        }

    }
}
