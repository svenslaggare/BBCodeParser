/// <reference path="bbCodeParser.ts" />
/// <reference path="tokenizer.ts" />

//The types of the trees
enum TreeType { Root, Text, Tag }

//Represents a parse tree
class BBCodeParseTree {
    //Creates a new parse tree
    constructor(public treeType: TreeType, public content: string, public attributes?: Array<String>, public subTrees?: Array<BBCodeParseTree>) {
        this.subTrees = new Array<BBCodeParseTree>();
    }

    //Indicates if the current tree is valid
    isValid() {
        //An tree without subtrees is valid
        if (this.subTrees.length == 0) {
            return true;
        }

        //An tree is valid if all of its subtrees are valid
        for (var i in this.subTrees) {
            var currentTree = this.subTrees[i];

            if (currentTree == null || !currentTree.isValid()) {
                return false;
            }
        }

        return true;
    }

    //String representation of the tree
    toString() {
        return TreeType[this.treeType] + " - " + this.content;
    }

    //Builds a parse tree from the given string
    public static buildTree(str: string, bbTags: Array<BBTag>) {
        //Get the tokens
        var tokenizer = new Tokenizer(bbTags);
        var tokens = tokenizer.tokenizeString(str);

        //Build the tree
        return BBCodeParseTree.buildTreeFromTokens(
            new BBCodeParseTree(
                TreeType.Root,
                str),
            tokens.reverse());
    }

    //Builds a tree from the given tokens
    private static buildTreeFromTokens(rootTree: BBCodeParseTree, tokens: Array<Token>, currentTag = ""): BBCodeParseTree {
        //The root root is invalid, return null
        if (rootTree == null) {
            return null;
        }

        //There are no more tokens, return the root
        if (tokens.length == 0) {
            return rootTree;
        }

        //Remove the first token
        var currentToken = tokens.pop();

        //Add the text token as a text parse tree
        if (currentToken.tokenType == TokenType.Text) {
            rootTree.subTrees.push(new BBCodeParseTree(
                TreeType.Text,
                currentToken.content));
        }

        //Create a new tag tree and find its subtrees
        if (currentToken.tokenType == TokenType.StartTag) {
            var tagName = currentToken.content;
            rootTree.subTrees.push(
                BBCodeParseTree.buildTreeFromTokens(
                    new BBCodeParseTree(
                        TreeType.Tag,
                        tagName,
                        currentToken.tagAttributes),
                    tokens,
                    tagName));
        }

        //Check if its the correct end tag
        if (currentToken.tokenType == TokenType.EndTag) {
            var tagName = currentToken.content;

            if (tagName == currentTag) {
                return rootTree;
            }
            else {
                return null;
            }
        }

        //If we got no more tokens, and we have opened an tag but not closed it, return null
        if (tokens.length == 0) {
            if (currentTag != "") {
                return null;
            }
        }

        //Proceed to the next token
        return BBCodeParseTree.buildTreeFromTokens(rootTree, tokens, currentTag);
    }
}
