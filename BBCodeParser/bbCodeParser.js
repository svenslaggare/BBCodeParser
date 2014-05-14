//Indicates if the first string ends with the second str
function endsWith(str, endStr) {
    if (str.length == 0) {
        return false;
    }

    if (endStr.length > str.length) {
        return false;
    }

    var inStrEnd = str.substr(str.length - endStr.length, endStr.length);
    return endStr == inStrEnd;
}

//Indicates if the first string starts with the second str
function startsWith(str, startStr) {
    if (str.length == 0) {
        return false;
    }

    if (startStr.length > str.length) {
        return false;
    }

    var inStrStart = str.substr(0, startStr.length);
    return startStr == inStrStart;
}

//var escape = document.createElement("textarea");
////Escapes the given html
//function escapeHTML(html) {
//    escape.innerHTML = html;
//    return escape.innerHTML;
//}
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

//Represents an BB tag
var BBTag = (function () {
    //Creates an new BB tag
    function BBTag(tagName, insertLineBreaks, suppressLineBreaks, noNesting, markupGenerator) {
        this.tagName = tagName;
        this.insertLineBreaks = insertLineBreaks;
        this.suppressLineBreaks = suppressLineBreaks;
        this.noNesting = noNesting;
        this.markupGenerator = markupGenerator;
        //If no generator is defined, use the default one
        if (markupGenerator == undefined) {
            this.markupGenerator = function (tag, content, attr) {
                return "<" + tag.tagName + ">" + content + "</" + tag.tagName + ">";
            };
        }
    }
    return BBTag;
})();

//Represents an BB code parser
var BBCodeParser = (function () {
    //Creates an new parser with the given tags
    function BBCodeParser(bbTags) {
        this.bbTags = bbTags;
    }
    //Parses the given string
    BBCodeParser.prototype.parseString = function (content) {
        //Create the parse tree
        var parseTree = BBCodeParseTree.buildTree(content, this.bbTags);

        //If the tree is invalid, return the input as text
        if (!parseTree.isValid()) {
            return content;
        }

        //Convert it to HTML
        return this.treeToHtml(parseTree.subTrees, true);
    };

    //Converts the given subtrees into html
    BBCodeParser.prototype.treeToHtml = function (subTrees, insertLineBreak) {
        var _this = this;
        var htmlString = "";
        var suppressLineBreak = false;

        subTrees.forEach(function (currentTree) {
            if (currentTree.treeType == 1 /* Text */) {
                var textContent = currentTree.content;

                textContent = escapeHTML(textContent);

                if (insertLineBreak && !suppressLineBreak) {
                    textContent = textContent.replace(/(\r\n|\n|\r)/gm, "<br>");
                    suppressLineBreak = false;
                }

                htmlString += textContent;
            } else {
                //Get the tag
                var bbTag = _this.bbTags[currentTree.content];
                var content = _this.treeToHtml(currentTree.subTrees, bbTag.InsertLineBreaks);
                htmlString += bbTag.markupGenerator(bbTag, content, currentTree.attributes);
                suppressLineBreak = bbTag.suppressLineBreaks;
            }
        });

        return htmlString;
    };
    return BBCodeParser;
})();

//The parser settings
var BBCodeParserSettings = (function () {
    function BBCodeParserSettings() {
    }
    //Returns the default tags
    BBCodeParserSettings.defaultTags = function (languages) {
        var bbTags = new Array();

        //Simple tags
        bbTags["b"] = new BBTag("b", true, false, false);
        bbTags["i"] = new BBTag("i", true, false, false);
        bbTags["u"] = new BBTag("u", true, false, false);

        bbTags["text"] = new BBTag("text", true, false, true, function (tag, content, attr) {
            return content;
        });

        bbTags["img"] = new BBTag("img", true, false, false, function (tag, content, attr) {
            return "<img src=\"" + content + "\" />";
        });

        bbTags["url"] = new BBTag("url", true, false, false, function (tag, content, attr) {
            var link = content;

            if (attr["url"] != undefined) {
                link = escapeHTML(attr["url"]);
            }

            if (!startsWith(link, "http://") && !startsWith(link, "https://")) {
                link = "http://" + link;
            }

            return "<a href=\"" + link + "\" target=\"_blank\">" + content + "</a>";
        });

        return bbTags;
    };
    return BBCodeParserSettings;
})();
