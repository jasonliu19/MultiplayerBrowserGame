var express = require('express');
var app = express();
var serv = require('http').Server(app);
var config = require('cloud-env');
var p2 = require('p2');
var io = require('socket.io')(serv,{});

app.get('/', function (req, res){
   res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));
app.use('/assets', express.static(__dirname + '/assets'));

 
serv.listen(config.PORT, config.IP, function () {
  console.log( "Listening on " + config.IP + ", port " + config.PORT )
});

var world = new p2.World({
    gravity:[0, 0]
});


var boxShape = new p2.Box({width:256, height:256});


var Player = function (id) {
    var self = {};
    self.id = id;

    self.pressingRight= false;
    self.pressingLeft= false;
    self.pressingDown= false;
    self.pressingUp= false;

    self.maxspeed = 200;

    self.body = new p2.Body({
    	mass:1,
    	position:[250,250],
    });

    self.body.addShape(new p2.Box({width:94, height:62}));
    world.addBody(self.body);

    self.updateVel = function () {
        if(self.pressingRight)
            self.body.velocity[0] = self.maxspeed;
        else if(self.pressingLeft)
            self.body.velocity[0] = -self.maxspeed;
        else
            self.body.velocity[0] = 0;

        if(self.pressingUp)
            self.body.velocity[1] = -self.maxspeed;
        else if(self.pressingDown)
            self.body.velocity[1] = self.maxspeed;
        else
            self.body.velocity[1] = 0;
    }

    self.update = function () {
        self.updateVel();
    }

    Player.list[id] = self;
    return self;
}

Player.list = {};

Player.onConnect = function (socket) {
    console.log("Socket: " + socket.id);
    var player = Player(socket.id);

    socket.on('updateServerOnMainPlayer', function (data) {
        player.pressingLeft = data.left;
        player.pressingRight = data.right;
        player.pressingDown = data.down;
        player.pressingUp = data.up;
    });
    
}

Player.onDisconnect = function (socket) {
    delete Player.list[socket.id];
}

// Player.update = function () {
//     var pack = [];
//     for(var i in Player.list){
//         var player = Player.list[i];
//         player.update();
//         pack.push({
//             x:player.x,
//             y:player.y,
//             id:player.id,
//         });

//     }
//     return pack;
// }

var SOCKET_LIST = {};

io.sockets.on('connection', function (socket) {
	Player.onConnect(socket);
    SOCKET_LIST[socket.id] = socket;
    socket.on('disconnect', function () {
    	Player.onDisconnect(socket);
        delete SOCKET_LIST[socket.id];
    });
});

var lastTime = Date.now();
setInterval(function () {
	var delta = Date.now()- lastTime;
	lastTime = Date.now();
	world.step(delta/1000);
	for(var i in Player.list){
        var player = Player.list[i];
        player.update();
    }
}, 1000/60);

setInterval(function () {
    for(var i in Player.list){
        var player = Player.list[i];
        console.log("X: " + player.body.position[0]);
        SOCKET_LIST[i].emit('updateClientOnMainPlayer', player.body.position);
    }


}, 1000/20);