package {

    import flash.display.Sprite;
    import flash.display.StageAlign;
    import flash.display.StageScaleMode;
    import flash.events.Event;
    import flash.text.engine.ElementFormat;
    import flash.text.engine.FontDescription;
    import flash.text.engine.FontLookup;
    import flash.text.engine.TextBlock;
    import flash.text.engine.TextElement;
    import flash.text.engine.TextLine;

public class Main extends Sprite {

        [Embed(source="SourceSansPro-Regular.otf",
                mimeType="application/x-font-opentype",
                fontFamily="SourceSansPro",
                fontWeight="Regular",
                fontStyle="Regular",
                embedAsCFF="true")]
        private var recorderFontOTFEmbed:Class;

        public function Main() {
            this.addEventListener(Event.ADDED_TO_STAGE, onAddedToStage);
        }

        private function onAddedToStage(event:Event):void {

            stage.align = StageAlign.TOP_LEFT;
            stage.scaleMode = StageScaleMode.NO_SCALE;

            var fontDescription:FontDescription = new FontDescription();
            fontDescription.fontLookup = FontLookup.EMBEDDED_CFF;
            fontDescription.fontName = "SourceSansPro";

            var fontFormat:ElementFormat = new ElementFormat(fontDescription);
            fontFormat.fontSize = 16;

            var textBlock:TextBlock = new TextBlock();
            textBlock.content= new TextElement("Hello World", fontFormat);
            var textLine:TextLine = textBlock.createTextLine(null, 215, 0.0, true);

            addChild(textLine);
            textLine.x = 4;
            textLine.y = 16;
        }

    }
}