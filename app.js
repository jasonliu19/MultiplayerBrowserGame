var express = require('express');
var app = express();
var serv = require('http').Server(app);
var config = require('cloud-env');
var p2 = require('p2');
var io = require('socket.io')(serv,{});
var GAMEBOUNDX = 1920;
var GAMRBOUNDY = 1080;

app.get('/', function (req, res){
   res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));
app.use('/assets', express.static(__dirname + '/assets'));


serv.listen(8006, config.IP, function () {
  console.log( "Listening on " + config.IP + ", port " + 8006 )

	  //*****Initmap*******
	Block.createLine(0, 600, 10, 'right', 'tree');
	Block.createLine(1000, 0, 10, 'down', 'grass');
});


var world = new p2.World({
    gravity:[0, 0]
});

var BLOCKSIZE = 64;
var DEFAULTBLOCKTEXTURE = 'grass';

//Server player class
var Player = function (id) {
    var self = {};
    self.id = id;

    self.pressingRight= false;
    self.pressingLeft= false;
    self.pressingDown= false;
    self.pressingUp= false;

    self.maxspeed = 150;

    self.angle = 0;

    self.body = new p2.Body({
    	mass:1,
    	position:[250,250],
    });

    self.heatlhpoints = 100;

    self.body.addShape(new p2.Box({width:64, height:64}));
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

    self.worldbounds = function () {
    	if (self.body.position[0] <= 0) 
    		if (self.body.velocity[0] < 0)
    			self.body.velocity[0] = 0;
    	if (self.body.position[0] >= 1840)
    		if (self.body.velocity[0] > 0)
    			self.body.velocity[0] = 0;
    	if (self.body.position[1] <= 0)
    		if (self.body.velocity[1] < 0) 
    			self.body.velocity[1] = 0;
    	if (self.body.position[1] >= 970)
    		if (self.body.velocity[1] > 0)
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
    console.log("Socket connected with ID: " + socket.id);

    var otherPlayersData = Player.generateCurrentStatusPackage();
    socket.emit('onInitialJoinPopulatePlayers', otherPlayersData);
    var mapData = Block.generateMapData();
    socket.emit('createMap', mapData);

    var player = Player(socket.id);
    socket.on('updateServerOnMainPlayer', function (data) {
        player.pressingLeft = data.inputs.left;
        player.pressingRight = data.inputs.right;
        player.pressingDown = data.inputs.down;
        player.pressingUp = data.inputs.up;
        player.angle = data.angle;
    });
    
    Enemy.initializeEnemy(socket.id);
    
    var enemyData = Enemy.generateCurrentStatusPackage();
    socket.emit('onInitialJoinPopulateZombies', enemyData)
    //Notify other players
    socket.broadcast.emit('newPlayer', socket.id);

    socket.on('requestServerForBullet', Bullet.handleCreateRequest);
    
}

Player.onDisconnect = function (socket) {
    Enemy.onPlayerDisconnect(socket.id);
    delete Player.list[socket.id];
}

Player.generateCurrentStatusPackage = function(){
	var pack = {};
	for(var i in Player.list){
		pack[i] = {
			position : Player.list[i].body.position,
			angle : Player.list[i].angle,
			health : Player.list[i].healthpoints,
		};
	}
	return pack;
}


var Bullet = function(angle, position){
	var self = {};
	self.id = Math.random();
	self.maxspeed = 1200;
	self.body = new p2.Body({
		mass : 1,
		position : position,
		angle: angle,
		velocity: [Math.cos(angle/180*Math.PI) * self.maxspeed, Math.sin(angle/180*Math.PI) * self.maxspeed]
	});
	self.body.addShape(new p2.Box({width:8, height:32}));
	self.timeAlive = 0;
	Bullet.array[self.id] = self;
}

Bullet.array = {};

Bullet.destroyOldBullets = function(){
	for(var id in Bullet.array){
		if(Bullet.array[id].timeAlive > 30){
			delete Bullet.array[id];
		} else{
			Bullet.array[id].timeAlive++;
		}
	}
}

Bullet.handleCreateRequest = function(data){
	Bullet(data.angle, data.position);
	for(var id in SOCKET_LIST){
		SOCKET_LIST[id].emit('bulletCreate', data);
	}
}

var Block = function(x,y,texture){
    var self = {};
    self.texture = texture;
    self.body = new p2.Body({
    	position:[x,y],
    	type: p2.Body.KINEMATIC
    });
    self.body.addShape(new p2.Box({width:BLOCKSIZE, height:BLOCKSIZE}));
    world.addBody(self.body);
    Block.list.push(self);
    return self;
}


//Change to object if implementing destructable terrain
Block.list = [];

Block.generateMapData = function(){
	var data = [];
	for(var i = 0; i < Block.list.length; i++){
		data[i] = {texture: Block.list[i].texture, position: Block.list[i].body.position};
	}
	return data;
}

//No left or up support yet
Block.createLine = function(x, y, length, direction, texture){
	for(var i = 0; i < length; i++){
		if(direction === 'right'){
			Block(x+i*BLOCKSIZE, y, texture);
		} else if(direction === 'down'){
			Block(x, y+i*BLOCKSIZE, texture);
		}
	}
}


var Enemy = function(x, y, playerid){
    var self = {};
    self.id = Math.random();
    self.maxspeed = 75;
    self.playerid = playerid;

    self.angle = 0;

    self.body = new p2.Body({
    	mass:1,
    	position:[x,y],
    });
    self.body.addShape(new p2.Box({width:BLOCKSIZE, height:BLOCKSIZE}));
    world.addBody(self.body);

    self.updateVelocity = function () {
        if(Player.list[self.playerid].body.position[0] > self.body.position[0])
            self.body.velocity[0] = self.maxspeed;
        else if(Player.list[self.playerid].body.position[0] < self.body.position[0])
            self.body.velocity[0] = -self.maxspeed;
        else
            self.body.velocity[0] = 0;

        if(Player.list[self.playerid].body.position[1] < self.body.position[1])
            self.body.velocity[1] = -self.maxspeed;
        else if(Player.list[self.playerid].body.position[1] > self.body.position[1])
            self.body.velocity[1] = self.maxspeed;
        else
            self.body.velocity[1] = 0;
    }
    
    self.worldbounds = function () {
    	if (self.body.position[0] <= 0) 
    		if (self.body.velocity[0] < 0)
    			self.body.velocity[0] = 0;
    	if (self.body.position[0] >= 1840)
    		if (self.body.velocity[0] > 0)
    			self.body.velocity[0] = 0;
    	if (self.body.position[1] <= 0)
    		if (self.body.velocity[1] < 0) 
    			self.body.velocity[1] = 0;
    	if (self.body.position[1] >= 970)
    		if (self.body.velocity[1] > 0)
    			self.body.velocity[1] = 0;
    }
    
    self.update = function () {
        self.updateVelocity();
    }
    
    Enemy.list[self.id] = self;
    return self;
}

Enemy.list = {};

Enemy.initializeEnemy = function(id) {
    var enemy = Enemy(20, 20, id);
    for(i in SOCKET_LIST){
        SOCKET_LIST[i].emit('createEnemy', {id: enemy.id, position: [20, 20]});
    }
}

Enemy.generateCurrentStatusPackage = function(){
	var pack = {};
	for(var i in Enemy.list){
		pack[i] = {
			position : Enemy.list[i].body.position,
		};
	}
	return pack;
}

Enemy.onPlayerDisconnect = function(playerid){
    for(var i in Enemy.list){
        if(Enemy.list[i].playerid === playerid){
            Enemy.destroy(i);
        }
    }
}

Enemy.destroy = function(enemyid){
    delete Enemy.list[enemyid];
    for(i in SOCKET_LIST){
        SOCKET_LIST[i].emit('deleteEnemy', enemyid);
    }
}


//Don't need to touch stuff below here
var SOCKET_LIST = {};
//Handle initial socket connection
io.sockets.on('connection', function (socket) {
    SOCKET_LIST[socket.id] = socket;
	Player.onConnect(socket);
    socket.on('disconnect', function () {
    	socket.broadcast.emit('playerDisconnect', socket.id);
    	Player.onDisconnect(socket);
        delete SOCKET_LIST[socket.id];
    });
});

//Physics loop
var lastTime = Date.now();
setInterval(function () {
	var delta = Date.now() - lastTime;
	lastTime = Date.now();
	for(var i in Player.list){
        var player = Player.list[i];
        player.update();
        //Check if player is outofbounds
        player.worldbounds();
    }
	world.step(delta/1000);
	Bullet.destroyOldBullets();
    //function to path zombies
    for(var i in Enemy.list){
        var enemy = Enemy.list[i];
        enemy.update();
        //Check if enemy is out of bounds
        enemy.worldbounds();
    }
}, 1000/60);

//Update clients loop
setInterval(function () {
    for(var i in SOCKET_LIST){
    	var pack = Player.generateCurrentStatusPackage();
        SOCKET_LIST[i].emit('updateClientOnPlayers', pack);
        pack = Enemy.generateCurrentStatusPackage();
        SOCKET_LIST[i].emit('updateClientOnEnemies', pack);
    }
}, 1000/40);