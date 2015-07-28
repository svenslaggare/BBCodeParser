/// <reference path="bbCodeParser.ts" />

//The type of a token
enum TokenType { Text, StartTag, EndTag }

//Represents a token
class Token {
    constructor(public tokenType: TokenType, public content: string, public tagAttributes?: Array<string>, public tagStr?: string) {

    }

    //String representation of the token
    toString() {
        return this.content + " (" + TokenType[this.tokenType] + ")";
    }

    //Check for equality
    equals(token: Token) {
        return this.tokenType == token.tokenType && this.content == token.content;
    }
}

//Creates a new text token
function textToken(content: string) {
    return new Token(TokenType.Text, content);
}

var attrNameChars = "[a-zA-Z0-9\\.\\-_:;/]";
//var attrNameChars = "\\w";
var attrValueChars = attrNameChars;

//Creates a new tag token
function tagToken(match) {
    if (match[1] == undefined) { //Start tag
        var tagName = match[2];
        var attributes = new Array<string>();
        var attrPattern = new RegExp("(" + attrNameChars + "+)?=\"(" + attrValueChars + "*)\"", "g");

        var attrStr = match[0].substr(1 + tagName.length, match[0].length - 2 - tagName.length);

        var attrMatch;
        while (attrMatch = attrPattern.exec(attrStr)) {
            if (attrMatch[1] == undefined) { //The tag attribute
                attributes[tagName] = attrMatch[2];
            } else { //Normal attribute
                attributes[attrMatch[1]] = attrMatch[2];
            }
        }

        return new Token(TokenType.StartTag, tagName, attributes, match[0]);
    } else { //End tag
        return new Token(TokenType.EndTag, match[1].substr(1, match[1].length - 1));
    }
}

//Converts the given token to a text token
function asTextToken(token: Token) {
    if (token.tokenType == TokenType.StartTag) {
        token.content = token.tagStr;
        token.tokenType = TokenType.Text;
        //delete token.attributes;
        //delete token.tagStr;
    }

    if (token.tokenType == TokenType.EndTag) {
        token.content = "[/" + token.content + "]";
        token.tokenType = TokenType.Text;
    }
}

//Represents a tokenizer
class Tokenizer {
    //Creates a new tokenizer with the given tags
    constructor(private bbTags: Array<BBTag>) {

    }

    //Tokenizes the given string
    tokenizeString(str: string) {
        var tokens = this.getTokens(str);
        var newTokens = new Array<Token>();

        var noNesting = false;
        var noNestingTag = "";
        var noNestedTagContent = "";

        for (var i in tokens) {
            var currentToken = tokens[i];
            var bbTag: BBTag = this.bbTags[currentToken.content];
            var addTag = true;

            //Replace invalid tags with text
            if (bbTag === undefined && !noNesting) {
                asTextToken(currentToken);
            } else {
                //Check if current tag doesn't support nesting
                if (noNesting) {
                    if (currentToken.tokenType == TokenType.EndTag && currentToken.content == noNestingTag) {
                        noNesting = false;
                        newTokens.push(textToken(noNestedTagContent));
                    } else {
                        asTextToken(currentToken);
                        noNestedTagContent += currentToken.content;
                        addTag = false;
                    }
                } else {
                    if (bbTag.noNesting && currentToken.tokenType == TokenType.StartTag) {
                        noNesting = true;
                        noNestingTag = currentToken.content;
                        noNestedTagContent = "";
                    }
                }
            }

            if (addTag) {
                newTokens.push(currentToken);
            }
        }

        return newTokens;
    }

    //Gets the tokens from the given string
    getTokens(str: string) {
        var pattern = "\\[(\/\\w*)\\]|\\[(\\w*)+(=\"" + attrValueChars + "*\")?( " + attrNameChars + "+=\"" + attrValueChars + "*\")*\\]";
        var tagPattern = new RegExp(pattern, "g");
        var tokens = new Array<Token>();

        var match;
        var lastIndex = 0;

        while (match = tagPattern.exec(str)) {
            var delta = match.index - lastIndex;

            if (delta > 0) {
                tokens.push(textToken(str.substr(lastIndex, delta)));
            }

            tokens.push(tagToken(match));
            lastIndex = tagPattern.lastIndex;
        }

        var delta = str.length - lastIndex;

        if (delta > 0) {
            tokens.push(textToken(str.substr(lastIndex, delta)));
        }

        return tokens;
    }
}