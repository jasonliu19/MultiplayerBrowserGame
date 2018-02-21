var config = require('cloud-env');
var express = require('express');
var app = express();
var serv = require('http').Server(app);
var io = require('socket.io')(serv,{});
var path = require('path');

var SOCKET_LIST = {};

var lastConnectedSocket = null;
app.get('/', function (req, res){
   res.sendFile(path.join(__dirname, '../client', 'index.html'));
});
app.use('/client', express.static(path.join(__dirname, '../client')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));

serv.listen(config.PORT, config.IP, function () {
  console.log( "Listening on " + config.IP + ", port " + config.PORT )
});


io.sockets.on('connection', function (socket) {
	console.log("sockethandler working");
	lastConnectedSocket = socket;
});

exports.lastConnectedSocket = lastConnectedSocket;
exports.SOCKET_LIST = SOCKET_LIST;
exports.io = io;

exports.getLastConnectedSocket = function(){
	return lastConnectedSocket;
}

exports.emitAll = function(emitMessage, data){
    for(var i in SOCKET_LIST){
        try {
        	SOCKET_LIST[i].emit(emitMessage, data);
        }
        catch(error) {
        	console.log(error);
        }

    }
}
