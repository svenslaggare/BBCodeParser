/// <reference path="bbCodeParser.ts" />

//Represents a tokenizer
class TokenizerOld {
    //Creates a new tokenizer with the given tags
    constructor(private bbTags: Array<BBTag>) {

    }

    //Indicates if the given string is a start token
    isStartTag(str: string) {
        return str[0] == '[' && str[str.length - 1] == ']';
    }

    //Indicates if the given string is an end token
    isEndTag(str: string) {
        return str[0] == '[' && str[1] == '/' && str[str.length - 1] == ']';
    }

    //Creates a text token from the given content
    createTextToken(content: string) {
        return new Token(TokenType.Text, content);
    }

    //Creates an end token from the given string
    createEndTagToken(str: string, tokenStart: number, tokenLength: number) {
        var endTagStart = tokenStart;
        var endTagEnd = tokenStart + tokenLength - 1;
        var endTag = str.substr(endTagStart, endTagEnd - endTagStart + 1);
        endTag = endTag.substr(2, endTag.length - 3);

        return new Token(TokenType.EndTag, endTag);
    }

    //Creates a simple end token from the given string
    createSimpleEndTagToken(str: string) {
        str = str.substr(2, str.length - 3);
        return new Token(TokenType.EndTag, str);
    }

    //Creates a start token from the given string
    createStartTagToken(str: string) {
        str = str.substr(1, str.length - 2);

        var tagName = str;
        var attributes = Array<string>();
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
                //Start a new attribute
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
                        }
                        else {
                            valueStarted = true;
                            attrValueStart = i + 1;
                        }
                    }
                }
            }

            i++;
        }

        return new Token(TokenType.StartTag, tagName, attributes);
    }

    //Tokenizes the given string
    tokenizeString(str: string) {
        //Tokenize the string 
        var tokens = this.getTokens(str);

        //Replace invalid tags with text tokens
        for (var i in tokens) {
            var currentToken = tokens[i];

            if (this.bbTags[currentToken.content] == undefined) {
                if (currentToken.tokenType == TokenType.StartTag) {
                    currentToken.content = "[" + currentToken.content + "]";
                    currentToken.tokenType = TokenType.Text;
                }

                if (currentToken.tokenType == TokenType.EndTag) {
                    currentToken.content = "[/" + currentToken.content + "]";
                    currentToken.tokenType = TokenType.Text;
                }
            }
        }

        return tokens;
    }

    //Gets the tokens from the given string
    getTokens(str: string) {
        var tokens = new Array<Token>();

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
                //The start of a tag
                if (str[i] == '[') {
                    if (currentStr.length > 1) {
                        //An inner part of a tag is text
                        var content = currentStr.substr(0, currentStr.length - 1);

                        if (content != "") {
                            tokens.push(this.createTextToken(content));
                        }
                    }

                    currentStr = "[";
                    currentStrStart = i;
                }

                //Tag must be atleast 3 characters long
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
                            var bbTag: BBTag = this.bbTags[startTag.content];

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

        //The string didn't end in a tag, add the rest as a text token
        if (!endedInTag) {
            var content = currentStr.substr(0, currentStr.length);

            if (content != "") {
                tokens.push(this.createTextToken(content));
            }
        }

        return tokens;
    }
}