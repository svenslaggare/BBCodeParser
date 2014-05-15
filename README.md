BBCodeParser
============
BB code parser writen in TypeScript.

#Usage
```javascript
<script src="bbCodeParser.min.js"></script>
...
var parser = new BBCodeParser(BBCodeParserSettings.defaultTags());
var inputText = "[b]Bold text[/b]";
var generatedHtml = parser.parseString(inputText);
```
#Custom tags
<b>BBTag constructor:</b>
<br>
tagName: The name of the tag.
<br>
insertLineBreaks: Indicates if the tag inserts line breaks (\n -> `<br>`) in the content.
<br>
suppressLineBreaks: Suppresses line breaks for any nested tag.
<br>
noNesting: If the tags doesn't support nested tags.
<br>
tagGenerator: The HTML generator for the tag. If not supplied the default one is used: `<tagName>content</tagName>`.

```javascript
var bbTags = {};

//Simple tag. A simple tag means that the generated HTML will be <tagName>content</tagName>
bbTags["b"] = new BBTag("b", true, false, false);

//Tag with a custom generator.
bbTags["img"] = new BBTag("img", true, false, false, function(tag, content, attr) {
	return "<img src=\"" + content + "\" />";
});

//Tag with a custom generator + attributes
bbTags["url"] = new BBTag("url", true, false, false, function(tag, content, attr) {
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
bbTags["code"] = new BBTag("code", true, false, true, (tag, content, attr) => {
    return "<code>" + content + "</code>";
});

var parser = new BBCodeParser(bbTags);
```
#Build
To run the build script you need:
* NodeJS
* TypeScript (npm install -g typescript)
* uglify-js (npm install uglify-js -g)
