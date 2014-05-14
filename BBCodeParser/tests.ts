/// <reference path="tsUnit.ts" />
/// <reference path="tokenizer.ts" />
/// <reference path="bbCodeParseTree.ts" />

//Tests the tokenizer
class TestTokenizer extends tsUnit.TestClass {
    testEndsWith() {
        this.isTrue(endsWith("troll alla", "alla"));
        this.isFalse(endsWith("troll alla", "hej alla barnen"));
        this.isTrue(endsWith("alla", "alla"));
    }

    testCreateStartTag() {
        var tokenizer = new Tokenizer(BBCodeParserSettings.defaultTags());

        var startTag = tokenizer.createStartTagToken("[b]");
        this.areIdentical("b", startTag.content);

        startTag = tokenizer.createStartTagToken("[b ]");
        this.areIdentical("b", startTag.content);

        startTag = tokenizer.createStartTagToken("[code lang=\"java\"]");
        this.areIdentical("code", startTag.content);
        this.areIdentical("java", startTag.tagAttributes["lang"]);

        startTag = tokenizer.createStartTagToken("[code lang=\"java\" tabs=\"false\"]");
        this.areIdentical("code", startTag.content);
        this.areIdentical("java", startTag.tagAttributes["lang"]);
        this.areIdentical("false", startTag.tagAttributes["tabs"]);

        startTag = tokenizer.createStartTagToken("[url=\"http://google.se\"]");
        this.areIdentical("url", startTag.content);
        this.areIdentical("http://google.se", startTag.tagAttributes["url"]);
    }

    testTokenize() {
        var tokenizer = new Tokenizer(BBCodeParserSettings.defaultTags());

        var tokens = tokenizer.tokenizeString("tja[b][i][u]Test[/u][/i][/b]då");
        this.isTrue(new Token("tja", TokenType.Text).equals(tokens[0]));
        this.isTrue(new Token("b", TokenType.StartTag).equals(tokens[1]));
        this.isTrue(new Token("i", TokenType.StartTag).equals(tokens[2]));
        this.isTrue(new Token("u", TokenType.StartTag).equals(tokens[3]));
        this.isTrue(new Token("Test", TokenType.Text).equals(tokens[4]));
        this.isTrue(new Token("u", TokenType.EndTag).equals(tokens[5]));
        this.isTrue(new Token("i", TokenType.EndTag).equals(tokens[6]));
        this.isTrue(new Token("b", TokenType.EndTag).equals(tokens[7]));
        this.isTrue(new Token("då", TokenType.Text).equals(tokens[8]));

        tokens = tokenizer.tokenizeString("[math][[1,2,3],[4,5,6]][/math]");
        this.isTrue(new Token("math", TokenType.StartTag).equals(tokens[0]));
        this.isTrue(new Token("[[1,2,3],[4,5,6]]", TokenType.Text).equals(tokens[1]));
        this.isTrue(new Token("math", TokenType.EndTag).equals(tokens[2]));

        tokens = tokenizer.tokenizeString("[code]var elo = tja[0];[/code]");
        this.isTrue(new Token("code", TokenType.StartTag).equals(tokens[0]));
        this.isTrue(new Token("var elo = tja[0];", TokenType.Text).equals(tokens[1]));
        this.isTrue(new Token("code", TokenType.EndTag).equals(tokens[2]));

        tokens = tokenizer.tokenizeString("tja [b]fan[/b då");
        this.isTrue(new Token("tja ", TokenType.Text).equals(tokens[0]));
        this.isTrue(new Token("b", TokenType.StartTag).equals(tokens[1]));
        this.isTrue(new Token("fan", TokenType.Text).equals(tokens[2]));
        this.isTrue(new Token("[/b då", TokenType.Text).equals(tokens[3]));

        tokens = tokenizer.tokenizeString("Testa följande: a[0][0]?");
        this.isTrue(new Token("Testa följande: a", TokenType.Text).equals(tokens[0]));
        this.isTrue(new Token("[0]", TokenType.Text).equals(tokens[1]));
        this.isTrue(new Token("[0]", TokenType.Text).equals(tokens[2]));
        this.isTrue(new Token("?", TokenType.Text).equals(tokens[3]));
    }

    testBuildTree() {
        var tags = BBCodeParserSettings.defaultTags();

        var parseTree = BBCodeParseTree.buildTree("tja[b]test[/b]då", tags);
        this.areIdentical(3, parseTree.subTrees.length);
        this.isTrue(parseTree.isValid());

        this.areIdentical("Text - tja", parseTree.subTrees[0].toString());

        this.areIdentical("Tag - b", parseTree.subTrees[1].toString());
        this.areIdentical("Text - test", parseTree.subTrees[1].subTrees[0].toString());

        this.areIdentical("Text - då", parseTree.subTrees[2].toString());

        parseTree = BBCodeParseTree.buildTree("tja[b][i][u]Test[/u][/i][/b]då", tags);
        this.areIdentical(3, parseTree.subTrees.length);
        this.isTrue(parseTree.isValid());
        this.areIdentical("Text - tja", parseTree.subTrees[0].toString());

        this.areIdentical("Tag - b", parseTree.subTrees[1].toString());
        this.areIdentical("Tag - i", parseTree.subTrees[1].subTrees[0].toString());
        this.areIdentical("Tag - u", parseTree.subTrees[1].subTrees[0].subTrees[0].toString());
        this.areIdentical("Text - Test", parseTree.subTrees[1].subTrees[0].subTrees[0].subTrees[0].toString());

        this.areIdentical("Text - då", parseTree.subTrees[2].toString());

        parseTree = BBCodeParseTree.buildTree("Kod: [code lang=\"js\"]function troll() { return lol(); }[/code]", tags);
        this.areIdentical(2, parseTree.subTrees.length);
        this.areIdentical(true, parseTree.isValid());

        this.areIdentical("Text - Kod: ", parseTree.subTrees[0].toString());
        this.areIdentical("Tag - code", parseTree.subTrees[1].toString());
        this.areIdentical("Text - function troll() { return lol(); }", parseTree.subTrees[1].subTrees[0].toString());
        this.areIdentical("js", parseTree.subTrees[1].attributes["lang"]);

        //Suppressed nesting
        parseTree = BBCodeParseTree.buildTree("bra [math][[1,2,3],[4,5,6]][/math]?", tags);
        this.areIdentical(3, parseTree.subTrees.length);
        this.areIdentical(true, parseTree.isValid());

        this.areIdentical("Text - bra ", parseTree.subTrees[0].toString());

        this.areIdentical("Tag - math", parseTree.subTrees[1].toString());
        this.areIdentical("Text - [[1,2,3],[4,5,6]]", parseTree.subTrees[1].subTrees[0].toString());
        this.areIdentical(1, parseTree.subTrees[1].subTrees.length);

        this.areIdentical("Text - ?", parseTree.subTrees[2].toString());

        //Invalid trees
        parseTree = BBCodeParseTree.buildTree("[b][i]tja[/b][/i]", tags);
        this.isFalse(parseTree.isValid());

        var parseTree = BBCodeParseTree.buildTree("tja [b]fan[/b då", tags);
        this.isFalse(parseTree.isValid());
    }

    testParseString() {
        var parser = new BBCodeParser(BBCodeParserSettings.defaultTags());

        var htmlStr = parser.parseString("[b]test[/b]");
        this.areIdentical("<b>test</b>", htmlStr);

        htmlStr = parser.parseString("tja [b][i]alla[/i][/b] noobs");
        this.areIdentical("tja <b><i>alla</i></b> noobs", htmlStr);

        htmlStr = parser.parseString("bra [math]x=e^x[/math]?\n[b]Okej da![/b]");
        this.areIdentical("bra `x=e^x`?<br><b>Okej da!</b>", htmlStr);

        htmlStr = parser.parseString("tja [b]fan[/b da");
        this.areIdentical("tja [b]fan[/b da", htmlStr);

        htmlStr = parser.parseString("Fungerar foljande: [troll]The troll tag[/troll]?");
        this.areIdentical("Fungerar foljande: [troll]The troll tag[/troll]?", htmlStr);

        htmlStr = parser.parseString("Fungerar [b]foljande[/b]: [troll]The troll tag[/troll]?");
        this.areIdentical("Fungerar <b>foljande</b>: [troll]The troll tag[/troll]?", htmlStr);

        htmlStr = parser.parseString("Kod: [code lang=\"javascript\"]function troll() { return lol(); }[/code]");
        console.log(htmlStr);
        this.areIdentical("Kod: <highlightCode class=\"language-javascript\">function troll() { return lol(); }</highlightCode>", htmlStr);

        htmlStr = parser.parseString("Test\r\ndå!");
        this.areIdentical("Test<br>då!", htmlStr);
    }
}

var test = new tsUnit.Test();
test.addTestClass(new TestTokenizer());
test.showResults(document.getElementById("results"), test.run());