/// <reference path="tsUnit.ts" />
/// <reference path="tokenizer.ts" />
/// <reference path="bbCodeParseTree.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
//Tests the tokenizer
var TestTokenizer = (function (_super) {
    __extends(TestTokenizer, _super);
    function TestTokenizer() {
        _super.apply(this, arguments);
    }
    TestTokenizer.prototype.testEndsWith = function () {
        this.isTrue(endsWith("troll alla", "alla"));
        this.isFalse(endsWith("troll alla", "hej alla barnen"));
        this.isTrue(endsWith("alla", "alla"));
    };

    TestTokenizer.prototype.testCreateStartTag = function () {
        var startTag = createStartTagToken("[b]");
        this.areIdentical("b", startTag.content);

        startTag = createStartTagToken("[b ]");
        this.areIdentical("b", startTag.content);

        startTag = createStartTagToken("[code lang=\"java\"]");
        this.areIdentical("code", startTag.content);
        this.areIdentical("java", startTag.tagAttributes["lang"]);

        startTag = createStartTagToken("[code lang=\"java\" tabs=\"false\"]");
        this.areIdentical("code", startTag.content);
        this.areIdentical("java", startTag.tagAttributes["lang"]);
        this.areIdentical("false", startTag.tagAttributes["tabs"]);

        startTag = createStartTagToken("[url=\"http://google.se\"]");
        this.areIdentical("url", startTag.content);
        this.areIdentical("http://google.se", startTag.tagAttributes["url"]);
    };

    TestTokenizer.prototype.testTokenize = function () {
        var tokens = tokenizeString("tja[b][i][u]Test[/u][/i][/b]då");
        this.isTrue(new Token("tja", 0 /* Text */).equals(tokens[0]));
        this.isTrue(new Token("b", 1 /* StartTag */).equals(tokens[1]));
        this.isTrue(new Token("i", 1 /* StartTag */).equals(tokens[2]));
        this.isTrue(new Token("u", 1 /* StartTag */).equals(tokens[3]));
        this.isTrue(new Token("Test", 0 /* Text */).equals(tokens[4]));
        this.isTrue(new Token("u", 2 /* EndTag */).equals(tokens[5]));
        this.isTrue(new Token("i", 2 /* EndTag */).equals(tokens[6]));
        this.isTrue(new Token("b", 2 /* EndTag */).equals(tokens[7]));
        this.isTrue(new Token("då", 0 /* Text */).equals(tokens[8]));

        tokens = tokenizeString("[math][[1,2,3],[4,5,6]][/math]");
        this.isTrue(new Token("math", 1 /* StartTag */).equals(tokens[0]));
        this.isTrue(new Token("[[1,2,3],[4,5,6]]", 0 /* Text */).equals(tokens[1]));
        this.isTrue(new Token("math", 2 /* EndTag */).equals(tokens[2]));

        tokens = tokenizeString("[code]var elo = tja[0];[/code]");
        this.isTrue(new Token("code", 1 /* StartTag */).equals(tokens[0]));
        this.isTrue(new Token("var elo = tja[0];", 0 /* Text */).equals(tokens[1]));
        this.isTrue(new Token("code", 2 /* EndTag */).equals(tokens[2]));

        tokens = tokenizeString("tja [b]fan[/b då");
        this.isTrue(new Token("tja ", 0 /* Text */).equals(tokens[0]));
        this.isTrue(new Token("b", 1 /* StartTag */).equals(tokens[1]));
        this.isTrue(new Token("fan", 0 /* Text */).equals(tokens[2]));
        this.isTrue(new Token("[/b då", 0 /* Text */).equals(tokens[3]));

        tokens = tokenizeString("Testa följande: a[0][0]?");
        this.isTrue(new Token("Testa följande: a", 0 /* Text */).equals(tokens[0]));
        this.isTrue(new Token("[0]", 0 /* Text */).equals(tokens[1]));
        this.isTrue(new Token("[0]", 0 /* Text */).equals(tokens[2]));
        this.isTrue(new Token("?", 0 /* Text */).equals(tokens[3]));
    };

    TestTokenizer.prototype.testBuildTree = function () {
        var parseTree = BBCodeParseTree.buildTree("tja[b]test[/b]då");
        this.areIdentical(3, parseTree.subTrees.length);
        this.isTrue(parseTree.isValid());

        this.areIdentical("Text - tja", parseTree.subTrees[0].toString());

        this.areIdentical("Tag - b", parseTree.subTrees[1].toString());
        this.areIdentical("Text - test", parseTree.subTrees[1].subTrees[0].toString());

        this.areIdentical("Text - då", parseTree.subTrees[2].toString());

        parseTree = BBCodeParseTree.buildTree("tja[b][i][u]Test[/u][/i][/b]då");
        this.areIdentical(3, parseTree.subTrees.length);
        this.isTrue(parseTree.isValid());
        this.areIdentical("Text - tja", parseTree.subTrees[0].toString());

        this.areIdentical("Tag - b", parseTree.subTrees[1].toString());
        this.areIdentical("Tag - i", parseTree.subTrees[1].subTrees[0].toString());
        this.areIdentical("Tag - u", parseTree.subTrees[1].subTrees[0].subTrees[0].toString());
        this.areIdentical("Text - Test", parseTree.subTrees[1].subTrees[0].subTrees[0].subTrees[0].toString());

        this.areIdentical("Text - då", parseTree.subTrees[2].toString());

        parseTree = BBCodeParseTree.buildTree("Kod: [code lang=\"js\"]function troll() { return lol(); }[/code]");
        this.areIdentical(2, parseTree.subTrees.length);
        this.areIdentical(true, parseTree.isValid());

        this.areIdentical("Text - Kod: ", parseTree.subTrees[0].toString());
        this.areIdentical("Tag - code", parseTree.subTrees[1].toString());
        this.areIdentical("Text - function troll() { return lol(); }", parseTree.subTrees[1].subTrees[0].toString());
        this.areIdentical("js", parseTree.subTrees[1].attributes["lang"]);

        //Suppressed nesting
        parseTree = BBCodeParseTree.buildTree("bra [math][[1,2,3],[4,5,6]][/math]?");
        this.areIdentical(3, parseTree.subTrees.length);
        this.areIdentical(true, parseTree.isValid());

        this.areIdentical("Text - bra ", parseTree.subTrees[0].toString());

        this.areIdentical("Tag - math", parseTree.subTrees[1].toString());
        this.areIdentical("Text - [[1,2,3],[4,5,6]]", parseTree.subTrees[1].subTrees[0].toString());
        this.areIdentical(1, parseTree.subTrees[1].subTrees.length);

        this.areIdentical("Text - ?", parseTree.subTrees[2].toString());

        //Invalid trees
        parseTree = BBCodeParseTree.buildTree("[b][i]tja[/b][/i]");
        this.isFalse(parseTree.isValid());

        var parseTree = BBCodeParseTree.buildTree("tja [b]fan[/b då");
        this.isFalse(parseTree.isValid());
    };

    TestTokenizer.prototype.testParseString = function () {
        var htmlStr = BBCodeParser.parseString("[b]test[/b]");
        this.areIdentical("<b>test</b>", htmlStr);

        htmlStr = BBCodeParser.parseString("tja [b][i]alla[/i][/b] noobs");
        this.areIdentical("tja <b><i>alla</i></b> noobs", htmlStr);

        htmlStr = BBCodeParser.parseString("bra [math]x=e^x[/math]?\n[b]Okej da![/b]");
        this.areIdentical("bra `x=e^x`?<br><b>Okej da!</b>", htmlStr);

        htmlStr = BBCodeParser.parseString("tja [b]fan[/b da");
        this.areIdentical("tja [b]fan[/b da", htmlStr);

        htmlStr = BBCodeParser.parseString("Fungerar foljande: [troll]The troll tag[/troll]?");
        this.areIdentical("Fungerar foljande: [troll]The troll tag[/troll]?", htmlStr);

        htmlStr = BBCodeParser.parseString("Fungerar [b]foljande[/b]: [troll]The troll tag[/troll]?");
        this.areIdentical("Fungerar <b>foljande</b>: [troll]The troll tag[/troll]?", htmlStr);

        htmlStr = BBCodeParser.parseString("Kod: [code lang=\"js\"]function troll() { return lol(); }[/code]");
        console.log(htmlStr);
        this.areIdentical("Kod: <pre class=\"brush: js\">function troll() { return lol(); }</pre>", htmlStr);

        htmlStr = BBCodeParser.parseString("Test\r\ndå!");
        this.areIdentical("Test<br>då!", htmlStr);
    };
    return TestTokenizer;
})(tsUnit.TestClass);

var test = new tsUnit.Test();
test.addTestClass(new TestTokenizer());
test.showResults(document.getElementById("results"), test.run());
