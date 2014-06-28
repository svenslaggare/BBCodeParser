var http = require('http');
var BBCodeParser = require('bbcode-parser');

var parser = new BBCodeParser(BBCodeParser.defaultTags());

// Parses the URL path and returns it as HTML
var server = http.createServer(function(req, res) {
	res.end(parser.parseString(unescape(req.url.slice(1))));
});

server.listen(3000);
console.log('Server started at localhost:3000');
