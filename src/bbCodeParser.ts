/// <reference path="bbCodeParseTree.ts" />
/// <reference path="bbTag.ts" />

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

//Represents a BB code parser
class BBCodeParser {
    //Creates a new parser with the given tags
    constructor(private bbTags: Array<BBTag>, private options = { escapeHTML: false }) {

    }

    //Parses the given string
    public parseString(content: string, stripTags = false, insertLineBreak = true, escapingHtml = true) {
        //Create the parse tree
        var parseTree = BBCodeParseTree.buildTree(content, this.bbTags);

        //If the tree is invalid, return the input as text
        if (parseTree == null || !parseTree.isValid()) {
            return content;
        }

        //Convert it to HTML
        return this.treeToHtml(parseTree.subTrees, insertLineBreak, escapingHtml, stripTags);
    }

    //Converts the given subtrees into html
    private treeToHtml(subTrees: Array<BBCodeParseTree>, insertLineBreak: boolean, escapingHtml: boolean, stripTags = false) {
        var htmlString = "";
        var suppressLineBreak = false;

        subTrees.forEach(currentTree => {
            if (currentTree.treeType == TreeType.Text) {
                var textContent = currentTree.content;

                if(escapingHtml){
                    textContent = (this.options.escapeHTML) ? escapeHTML(textContent) : textContent;
                }

                if (insertLineBreak && !suppressLineBreak) {
                    textContent = textContent.replace(/(\r\n|\n|\r)/gm, "<br>");
                    suppressLineBreak = false;
                }

                htmlString += textContent;
            } else {
                //Get the tag
                var bbTag = this.bbTags[currentTree.content];
                var content = this.treeToHtml(currentTree.subTrees, bbTag.insertLineBreaks, escapingHtml, stripTags);

                //Check if to strip the tags
                if (!stripTags) {
                    htmlString += bbTag.markupGenerator(bbTag, content, currentTree.attributes);
                } else {
                    htmlString += content;
                }

                suppressLineBreak = bbTag.suppressLineBreaks;
            }
        });

        return htmlString;
    }

    //Returns the default tags
    public static defaultTags(): Array<BBTag> {
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

    public static escapeHTML(content: string) {
        return escapeHTML(content);
    }

    public static startsWith(str:
        string, startStr: string) {
        return startsWith(str, startStr);
    }

    public static endsWith(str: string, endStr: string) {
        return endsWith(str, endStr);
    }
}
