var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/', function(req, res){
   res.sendFile(__dirname + '/client/index.html');
});
app.use('/assets', express.static(__dirname + '/assets'));
app.use('/client', express.static(__dirname + '/client'));
//Delete later

serv.listen(2000);
console.log("Server started");