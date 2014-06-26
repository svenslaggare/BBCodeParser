/// <reference path="bbCodeParseTree.ts" />

//Indicates if the first string ends with the second str
function endsWith(str: string, endStr: string) {
    if (str.length == 0) {
        return false;
    }

    if (endStr.length > str.length) {
        return false;
    }

    var inStrEnd = str.substr(str.length - endStr.length, endStr.length);
    return endStr == inStrEnd;
}

//Indicates if the first string starts with the second string
function startsWith(str: string, startStr: string) {
    if (str.length == 0) {
        return false;
    }

    if (startStr.length > str.length) {
        return false;
    }

    var inStrStart = str.substr(0, startStr.length);
    return startStr == inStrStart;
}

var tagsToReplace = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;'
};

//Escapes the given html
function escapeHTML(html) {
    return html.replace(/[&<>]/g, function (tag) {
        return tagsToReplace[tag] || tag;
    });
}

//Represents a BB tag
class BBTag {
    //Creates a new BB tag
    constructor(
        public tagName: string, //The name of the tag
        public insertLineBreaks: boolean, //Indicates if line breaks are inserted inside the tag content
        public suppressLineBreaks: boolean, //Suppresses any line breaks for nested tags
        public noNesting: boolean, //Indicates if the tag supports nested tags
        public markupGenerator?: (tag: BBTag, content: string, attr: Array<string>) => string) {
        //If no generator is defined, use the default one
        if (markupGenerator == undefined) {
            this.markupGenerator = (tag, content, attr) => {
                return "<" + tag.tagName + ">" + content + "</" + tag.tagName + ">";
            };
        }
    }

    //Creates a new simple tag
    public static createSimpleTag(tagName: string, insertLineBreaks: boolean = true) {
        return new BBTag(tagName, insertLineBreaks, false, false);
    }

    //Creates a tag with the given generator
    public static createTag(tagName: string, markupGenerator: (tag: BBTag, content: string, attr: Array<string>) => string, insertLineBreaks: boolean = true) {
        return new BBTag(tagName, insertLineBreaks, false, false, markupGenerator);
    }
}

//Represents a BB code parser
class BBCodeParser {
    //Creates a new parser with the given tags
    constructor(private bbTags: Array<BBTag>) {

    }

    //Parses the given string 
    public parseString(content: string) {
        //Create the parse tree
        var parseTree = BBCodeParseTree.buildTree(content, this.bbTags);

        //If the tree is invalid, return the input as text
        if (!parseTree.isValid()) {
            return content;
        }

        //Convert it to HTML
        return this.treeToHtml(parseTree.subTrees, true);
    }

    //Converts the given subtrees into html
    private treeToHtml(subTrees: Array<BBCodeParseTree>, insertLineBreak: boolean) {
        var htmlString = "";
        var suppressLineBreak = false;

        subTrees.forEach(currentTree => {
            if (currentTree.treeType == TreeType.Text) {
                var textContent = currentTree.content;

                textContent = escapeHTML(textContent);

                if (insertLineBreak && !suppressLineBreak) {
                    textContent = textContent.replace(/(\r\n|\n|\r)/gm, "<br>");
                    suppressLineBreak = false;
                }

                htmlString += textContent;
            } else {
                //Get the tag
                var bbTag = this.bbTags[currentTree.content];
                var content = this.treeToHtml(currentTree.subTrees, bbTag.InsertLineBreaks);
                htmlString += bbTag.markupGenerator(bbTag, content, currentTree.attributes);
                suppressLineBreak = bbTag.suppressLineBreaks;
            }
        });

        return htmlString;
    }
}

//The parser settings
class BBCodeParserSettings {
    //Returns the default tags
    static defaultTags(): Array<BBTag> {
        var bbTags = new Array<BBTag>();

        //Simple tags
        bbTags["b"] = new BBTag("b", true, false, false);
        bbTags["i"] = new BBTag("i", true, false, false);
        bbTags["u"] = new BBTag("u", true, false, false);

        bbTags["text"] = new BBTag("text", true, false, true, (tag, content, attr) => {
            return content;
        });

        bbTags["img"] = new BBTag("img", true, false, false, (tag, content, attr) => {
            return "<img src=\"" + content + "\" />";
        });

        bbTags["url"] = new BBTag("url", true, false, false, (tag, content, attr) => {
            var link = content;

            if (attr["url"] != undefined) {
                link = escapeHTML(attr["url"]);
            }

            if (!startsWith(link, "http://") && !startsWith(link, "https://")) {
                link = "http://" + link;
            }

            return "<a href=\"" + link + "\" target=\"_blank\">" + content + "</a>";
        });

        bbTags["code"] = new BBTag("code", true, false, true, (tag, content, attr) => {
            var lang = attr["lang"];

            if (lang !== undefined) {
                return "<code class=\"" + escapeHTML(lang) + "\">" + content + "</code>";
            } else {
                return "<code>" + content + "</code>";
            }
        });

        return bbTags;
    }
}