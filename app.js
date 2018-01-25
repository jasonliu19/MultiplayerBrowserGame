var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/', function (req, res){
   res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));
app.use('/assets', express.static(__dirname + '/assets'));

var server_port = process.env.OPENSHIFT_NODEJS_PORT || 8080
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1'
 
serv.listen(server_port, server_ip_address, function () {
  console.log( "Listening on " + server_ip_address + ", port " + server_port )
});



//serv.listen(2001);
//console.log("Server started");

var SOCKET_LIST = {};

var Entity = function () {
    var self = {
        x: 250,
        y: 250,
        spdX: 0,
        spdY: 0,
        id: "",
    }
    self.update = function () {
        self.updatePosition();
    }

    self.updatePosition = function () {
        self.x += self.spdX;
        self.y += self.spdY;
    }
    return self;
}

var Player = function (id) {
    var self = Entity();
    self.id = id;
    self.number="" + Math.floor(10*Math.random());
    self.pressingRight= false;
    self.pressingLeft= false;
    self.pressingDown= false;
    self.pressingUp= false;
    self.maxspeed=10;

    self.updateSpd = function () {
        if(self.pressingRight)
            self.spdX = self.maxspeed;
        else if(self.pressingLeft)
            self.spdX = -self.maxspeed;
        else
            self.spdX = 0;

        if(self.pressingUp)
            self.spdY = -self.maxspeed;
        else if(self.pressingDown)
            self.spdY = self.maxspeed;
        else
            self.spdY = 0;
    }

    var super_update = self.update;
    self.update = function () {
        self.updateSpd();
        super_update();
    }

    Player.list[id] = self;
    return self;
}

Player.list = {};
Player.onConnect = function (socket) {
    var player = Player(socket.id);

    socket.on('keypress', function (data) {
        if(data.inputId === 'left')
            player.pressingLeft = data.state;
        else if(data.inputId === 'right')
            player.pressingRight = data.state;
        else if(data.inputId === 'down')
            player.pressingDown = data.state;
        else if(data.inputId === 'up')
            player.pressingUp = data.state;
    });
}

Player.onDisconnect = function (socket) {
    delete Player.list[socket.id];
}

Player.update = function () {
    var pack = [];
    for(var i in Player.list){
        var player = Player.list[i];
        player.update();
        pack.push({
            x:player.x,
            y:player.y,
            id:player.id,
        });

    }
    return pack;
}

var Bullet = function (angle) {
    var self = Entity();
    self.id = Math.random();
    self.spdX = Math.cos(angle/180*Math.PI) * 10;
    self.spdY = Math.sin(angle/180*Math.PI) * 10;

    self.timer = 0;
    self.toRemove = false;
    var super_update = self.update;
    self.update = function () {
        if(self.timer++ > 50)
            self.toRemove = true;
        super_update();
        return self.toRemove;
    }
    Bullet.list[self.id] = self;
}
Bullet.list = {};

Bullet.update = function () {
    if(Math.random() < 0.05){
        Bullet(Math.random()*360);
    }

    var pack = [];
    for(var i in Bullet.list){
        var bullet = Bullet.list[i];
        if(bullet.update())
            delete Bullet.list[i];
        else {
            pack.push({
                x:bullet.x,
                y:bullet.y,
                id:bullet.id,
            });
        }

    }
    return pack;
}

var io = require('socket.io')(serv,{});

io.sockets.on('connection', function (socket) {
    //socket.id = Math.random();

    SOCKET_LIST[socket.id] = socket;

    Player.onConnect(socket);

    socket.on('disconnect', function () {
        delete SOCKET_LIST[socket.id];
        Player.onDisconnect(socket);
    });



});

setInterval(function () {
    var pack = {
        player: Player.update(),
        bullet: Bullet.update(),
    }


    for(var i in SOCKET_LIST){
        var socket = SOCKET_LIST[i];
        socket.emit('newPosition', pack);

    }

}, 1000/40);
