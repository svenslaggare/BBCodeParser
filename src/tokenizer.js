/// <reference path="bbCodeParser.ts" />
//The type of an token
var TokenType;
(function (TokenType) {
    TokenType[TokenType["Text"] = 0] = "Text";
    TokenType[TokenType["StartTag"] = 1] = "StartTag";
    TokenType[TokenType["EndTag"] = 2] = "EndTag";
})(TokenType || (TokenType = {}));

//Represents an token
var Token = (function () {
    function Token(content, tokenType, tagAttributes) {
        this.content = content;
        this.tokenType = tokenType;
        this.tagAttributes = tagAttributes;
    }
    //String representation of the token
    Token.prototype.toString = function () {
        return this.content + " (" + TokenType[this.tokenType] + ")";
    };

    //Check for equality
    Token.prototype.equals = function (token) {
        return this.tokenType == token.tokenType && this.content == token.content;
    };
    return Token;
})();

//Represents an tokenizer
var Tokenizer = (function () {
    //Creates an new tokenizer with the given tags
    function Tokenizer(bbTags) {
        this.bbTags = bbTags;
    }
    //Indicates if the given string is an start token
    Tokenizer.prototype.isStartTag = function (str) {
        return str[0] == '[' && str[str.length - 1] == ']';
    };

    //Indicates if the given string is an end token
    Tokenizer.prototype.isEndTag = function (str) {
        return str[0] == '[' && str[1] == '/' && str[str.length - 1] == ']';
    };

    //Creates an text token from the given content
    Tokenizer.prototype.createTextToken = function (content) {
        return new Token(content, 0 /* Text */);
    };

    //Creates an end token from the given string
    Tokenizer.prototype.createEndTagToken = function (str, tokenStart, tokenLength) {
        var endTagStart = tokenStart;
        var endTagEnd = tokenStart + tokenLength - 1;
        var endTag = str.substr(endTagStart, endTagEnd - endTagStart + 1);
        endTag = endTag.substr(2, endTag.length - 3);

        return new Token(endTag, 2 /* EndTag */);
    };

    //Creates an simple end token from the given string
    Tokenizer.prototype.createSimpleEndTagToken = function (str) {
        str = str.substr(2, str.length - 3);
        return new Token(str, 2 /* EndTag */);
    };

    //Creates an start token from the given string
    Tokenizer.prototype.createStartTagToken = function (str) {
        str = str.substr(1, str.length - 2);

        var tagName = str;
        var attributes = Array();
        var hasParsedName = false;

        var attrNameStart = 0;
        var attrName = "";
        var parseName = false;

        var attrValueStart = 0;
        var parseValue = false;
        var valueStarted = false;

        var i = 0;

        while (i < str.length) {
            var currentChar = str[i];

            if (!hasParsedName) {
                //Save the name of the tag and start parsing attributes
                if (currentChar == ' ') {
                    tagName = str.substr(0, i);
                    hasParsedName = true;
                    attrNameStart = i + 1;
                    parseName = true;
                }

                //The first attr name is same as the tag
                if (currentChar == '=') {
                    tagName = str.substr(0, i);
                    attrName = tagName;
                    hasParsedName = true;
                    parseValue = true;
                    valueStarted = false;
                    parseName = false;
                }
            } else {
                //Start an new attribute
                if (!parseName && !parseValue) {
                    if (currentChar == ' ') {
                        attrNameStart = i + 1;
                        parseName = true;
                    }
                }

                //The name of the attribute
                if (parseName) {
                    if (currentChar == '=') {
                        attrName = str.substr(attrNameStart, i - attrNameStart);
                        parseValue = true;
                        valueStarted = false;
                        parseName = false;
                    }
                }

                //The value of the attribute
                if (parseValue) {
                    if (currentChar == '"') {
                        if (valueStarted) {
                            var attrValue = str.substr(attrValueStart, i - attrValueStart);
                            parseValue = false;

                            if (attributes[attrName] == undefined) {
                                attributes[attrName] = attrValue;
                            }
                        } else {
                            valueStarted = true;
                            attrValueStart = i + 1;
                        }
                    }
                }
            }

            i++;
        }

        return new Token(tagName, 1 /* StartTag */, attributes);
    };

    //Tokenizes the given string
    Tokenizer.prototype.tokenizeString = function (str) {
        //Tokenize the string
        var tokens = this.getTokens(str);

        for (var i in tokens) {
            var currentToken = tokens[i];

            if (this.bbTags[currentToken.content] == undefined) {
                if (currentToken.tokenType == 1 /* StartTag */) {
                    currentToken.content = "[" + currentToken.content + "]";
                    currentToken.tokenType = 0 /* Text */;
                }

                if (currentToken.tokenType == 2 /* EndTag */) {
                    currentToken.content = "[/" + currentToken.content + "]";
                    currentToken.tokenType = 0 /* Text */;
                }
            }
        }

        return tokens;
    };

    //Gets the tokens from the given string
    Tokenizer.prototype.getTokens = function (str) {
        var tokens = new Array();

        var currentStr = "";
        var currentStrStart = 0;

        var i = 0;
        var endedInTag = false;
        var suppressNesting = false;
        var currentTag = "";

        while (i < str.length) {
            currentStr += str[i];

            //Check if nesting is supported
            if (!suppressNesting) {
                //The start of an tag
                if (str[i] == '[') {
                    if (currentStr.length > 1) {
                        //An inner part of an tag is text
                        var content = currentStr.substr(0, currentStr.length - 1);

                        if (content != "") {
                            tokens.push(this.createTextToken(content));
                        }
                    }

                    currentStr = "[";
                    currentStrStart = i;
                }

                //An tag must be atleast 3 characters long
                if (currentStr.length >= 3) {
                    //The current string is an end tag
                    if (this.isEndTag(currentStr)) {
                        tokens.push(this.createEndTagToken(str, currentStrStart, currentStr.length));
                        currentStr = "";

                        if (i == str.length - 1) {
                            endedInTag = true;
                        }
                    } else if (this.isStartTag(currentStr)) {
                        if (!suppressNesting) {
                            //The current string is an start tag
                            var startTag = this.createStartTagToken(currentStr);

                            tokens.push(startTag);
                            currentStr = "";
                            currentTag = startTag.content;

                            //Check if their exist an bb tag for the current tag
                            var bbTag = this.bbTags[startTag.content];

                            if (bbTag != undefined) {
                                if (bbTag.noNesting) {
                                    suppressNesting = true;
                                }
                            }
                        }
                    }
                }
            } else {
                //Nesting is suppressed
                var endTag = "[/" + currentTag + "]";

                if (endsWith(currentStr, endTag)) {
                    var content = currentStr.substr(0, currentStr.length - (3 + currentTag.length));
                    tokens.push(this.createTextToken(content));
                    tokens.push(this.createSimpleEndTagToken(endTag));
                    currentStr = "";
                    suppressNesting = false;

                    if (i == str.length - 1) {
                        endedInTag = true;
                    }
                }
            }

            i++;
        }

        //The string didn't end in an tag, add the rest as an text token
        if (!endedInTag) {
            var content = currentStr.substr(0, currentStr.length);

            if (content != "") {
                tokens.push(this.createTextToken(content));
            }
        }

        return tokens;
    };
    return Tokenizer;
})();
