var http = require('http');

http.createserver(function (req, res) {
   res.write("im alive");
   res.end();
}).listen(8080);
