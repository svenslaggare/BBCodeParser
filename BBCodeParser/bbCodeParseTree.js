/// <reference path="bbCodeParser.ts" />
/// <reference path="tokenizer.ts" />
//The types of the trees
var TreeType;
(function (TreeType) {
    TreeType[TreeType["Root"] = 0] = "Root";
    TreeType[TreeType["Text"] = 1] = "Text";
    TreeType[TreeType["Tag"] = 2] = "Tag";
})(TreeType || (TreeType = {}));

//Represents an parse tree
var BBCodeParseTree = (function () {
    //Creates an new parse tree
    function BBCodeParseTree(treeType, content, attributes, subTrees) {
        this.treeType = treeType;
        this.content = content;
        this.attributes = attributes;
        this.subTrees = subTrees;
        this.subTrees = new Array();
    }
    //Indicates if the current tree is valid
    BBCodeParseTree.prototype.isValid = function () {
        //An tree without subtrees is valid
        if (this.subTrees.length == 0) {
            return true;
        }

        for (var i in this.subTrees) {
            var currentTree = this.subTrees[i];

            if (currentTree == null || !currentTree.isValid()) {
                return false;
            }
        }

        return true;
    };

    //String representation of the tree
    BBCodeParseTree.prototype.toString = function () {
        return TreeType[this.treeType] + " - " + this.content;
    };

    //Builds an parse tree from the given string
    BBCodeParseTree.buildTree = function (str, bbTags) {
        //Get the tokens
        var tokenizer = new Tokenizer(bbTags);
        var tokens = tokenizer.tokenizeString(str);

        //Build the tree
        return BBCodeParseTree.buildTreeFromTokens(new BBCodeParseTree(0 /* Root */, str), tokens.reverse());
    };

    //Builds an tree from the given tokens
    BBCodeParseTree.buildTreeFromTokens = function (rootTree, tokens, currentTag) {
        if (typeof currentTag === "undefined") { currentTag = ""; }
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

        //Add the text token as an text parse tree
        if (currentToken.tokenType == 0 /* Text */) {
            rootTree.subTrees.push(new BBCodeParseTree(1 /* Text */, currentToken.content));
        }

        //Create an new tag tree and find its subtrees
        if (currentToken.tokenType == 1 /* StartTag */) {
            var tagName = currentToken.content;
            rootTree.subTrees.push(BBCodeParseTree.buildTreeFromTokens(new BBCodeParseTree(2 /* Tag */, tagName, currentToken.tagAttributes), tokens, tagName));
        }

        //Check if its the correct end tag
        if (currentToken.tokenType == 2 /* EndTag */) {
            var tagName = currentToken.content;

            if (tagName == currentTag) {
                return rootTree;
            } else {
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
    };
    return BBCodeParseTree;
})();
