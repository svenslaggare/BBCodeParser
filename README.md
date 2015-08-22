BBCodeParser
============
An extensible BB code parser written in TypeScript that can be used
both in the browser and Node.js.

# Usage
```javascript
<script src="bbCodeParser.min.js"></script>
...
var parser = new BBCodeParser(BBCodeParser.defaultTags());
var inputText = "[b]Bold text[/b]";
var generatedHtml = parser.parseString(inputText);
```

Node.js: `npm install bbcode-parser`

``` javascript
var BBCodeParser = require('bbcode-parser');
var parser = new BBCodeParser(BBCodeParser.defaultTags());
var html = parser.parseString('[b]Bold text[/b]');
```

# Custom tags
<b>BBTag constructor:</b>
* tagName: The name of the tag.
* insertLineBreaks: Indicates if the tag inserts line breaks (\n -> `<br>`) in the content.
* suppressLineBreaks: Suppresses line breaks for any nested tag.
* noNesting: If the tags doesn't support nested tags.
* tagGenerator: The HTML generator for the tag. If not supplied the default one is used: `<tagName>content</tagName>`.

```javascript
var bbTags = {};

//Simple tag. A simple tag means that the generated HTML will be <tagName>content</tagName>
bbTags["b"] = BBTag.createSimpleTag("b");

//Tag with a custom generator.
bbTags["img"] = BBTag.createSimpleTag("img", function (tag, content, attr) {
	return "<img src=\"" + content + "\" />";
});

//Tag with a custom generator + attributes
bbTags["url"] = BBTag.createSimpleTag("url", function (tag, content, attr) {
	var link = content;

	if (attr["site"] != undefined) {
		link = escapeHTML(attr["site"]);
 	}

	if (!startsWith(link, "http://") && !startsWith(link, "https://")) {
		link = "http://" + link;
	}

	return "<a href=\"" + link + "\" target=\"_blank\">" + content + "</a>";
});

//A tag that doesn't support nested tags. Useful when implementing code highlighting.
bbTags["code"] = new BBTag("code", true, false, true, function (tag, content, attr) {
    return "<code>" + content + "</code>";
});

var parser = new BBCodeParser(bbTags);
```

# Documentation
[See the wiki](https://github.com/svenslaggare/BBCodeParser/wiki/Documentation).

# Build
To run the build script you need:
* Node.js
* TypeScript (npm install -g typescript)
* uglify-js (npm install -g uglify-js)
