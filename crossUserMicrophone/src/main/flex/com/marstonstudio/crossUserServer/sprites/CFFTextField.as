package com.marstonstudio.crossUserServer.sprites {

    import flash.display.Sprite;
    import flash.text.engine.ElementFormat;
    import flash.text.engine.FontDescription;
    import flash.text.engine.FontLookup;
    import flash.text.engine.TextBlock;
    import flash.text.engine.TextElement;
    import flash.text.engine.TextLine;

    public class CFFTextField  extends Sprite {

        private var _fontFormat:ElementFormat;

        private var _width:Number;

        private var _textBlock:TextBlock;

        private var _textLine:TextLine;

        public function CFFTextField():* {
            super();
        }

        /**
         * Would be nice to have this in the constructor instead of an init class,
         * but had trouble passing parameters into constructor and getting an object back
         *
         * @param fontName
         * @param fontSize
         * @param width
         * @return
         */
        public function init(fontName:String, fontColor:uint, fontCFF:Boolean, fontSize:Number, width:Number):* {

            _width = width;

            var fontDescription:FontDescription = new FontDescription();
            fontDescription.fontLookup = fontCFF ? FontLookup.EMBEDDED_CFF : FontLookup.DEVICE;
            fontDescription.fontName = fontName;

            _fontFormat = new ElementFormat(fontDescription);
            _fontFormat.fontSize = fontSize;
            _fontFormat.color = fontColor;

            _textBlock = new TextBlock();
        }

        /**
         * CFFTextField must be added to stage before setting text value
         *
         * @param message
         */
        public function set text(message:String):void {
            if(_textLine != null) removeChild(_textLine);

            _textBlock.content= new TextElement(message, _fontFormat);
            _textLine = _textBlock.createTextLine(null, _width, 0.0, true);

            addChild(_textLine);
            _textLine.x = _fontFormat.fontSize / 4;
            _textLine.y = _fontFormat.fontSize;
        }
    }
}
