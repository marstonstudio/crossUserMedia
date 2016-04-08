package com.marstonstudio.crossusermedia.microphone.util {

    import flash.external.ExternalInterface;
    import flash.system.Capabilities;

    public class Console {

        public static function log(message:String):void {
            trace(message);
            ExternalInterface.call('console.log', message);
        }

        public static function logCapabilities():void {
            log('FLASH::' + Capabilities.version + " " + Capabilities.playerType + ' isDebugger:' + Capabilities.isDebugger);
        }

    }
}
