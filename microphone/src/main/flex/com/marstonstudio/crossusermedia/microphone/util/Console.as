package com.marstonstudio.crossusermedia.microphone.util {

import flash.external.ExternalInterface;
import flash.system.Capabilities;

public class Console {

    private static const LOG:int = 0;
    private static const WARN:int = 1;
    private static const ERROR:int = 2;

    public static function log(header:String, message:String):void {
        print(header, message, LOG);
    }

    public static function warn(header:String, message:String):void {
        print(header, message, WARN);
    }

    public static function error(header:String, e:Error):void {
        var message:String = e.toString() + "\n" + e.getStackTrace().toString();
        print(header, message, ERROR);
    }

    public static function logCapabilities(header:String):void {
        print(header, Capabilities.version + " " + Capabilities.playerType + ' isDebugger:' + Capabilities.isDebugger);
    }

    private static function print(header:String, message:String, level:int = LOG):void {

        var traceOutput:String = header + " :: ";
        if(level == WARN) traceOutput += "WARN :: ";
        if(level == ERROR) traceOutput += "ERROR :: ";
        traceOutput += message;
        trace(traceOutput);

        if(ExternalInterface.available) {
            if(level == ERROR) {
                ExternalInterface.call("console.error", header + " :: " + message);
            } else if (level == WARN) {
                ExternalInterface.call("console.warn", header + " :: " + message);
            } else {
                ExternalInterface.call("console.log", header + " :: " + message);
            }

        }
    }
}
}
