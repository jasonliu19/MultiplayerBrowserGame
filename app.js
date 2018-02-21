var express = require('express');
var app = express();
var serv = require('http').Server(app);
var config = require('cloud-env');
var p2 = require('p2');
var io = require('socket.io')(serv,{});
var GAMEBOUNDX = 1920;


app.get('/', function (req, res){
   res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));
app.use('/assets', express.static(__dirname + '/assets'));

var PLAYER = Math.pow(2,0);
var ENEMY = Math.pow(2,1);
var BULLET = Math.pow(2,2);
var BLOCK = Math.pow(2,3);

serv.listen(config.PORT, config.IP, function () {
  console.log( "Listening on " + config.IP + ", port " + config.PORT )

	  //*****Initmap*******
	Block.createLine(0, 600, 10, 'right', 'tree');
	Block.createLine(1000, 0, 10, 'down', 'grass');
});


var world = new p2.World({
    gravity:[0, 0]
});

var GUNDAMAGE = 34;
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

    var bodyShape = new p2.Box({width:64, height:64});
    bodyShape.collisionGroup = PLAYER;
    bodyShape.collisionMask = ENEMY | BLOCK | PLAYER;
    self.body.addShape(bodyShape);

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
    
    Enemy.initializeEnemy(socket.id,20,20);
    
    var enemyData = Enemy.generateCurrentStatusPackage();
    socket.emit('onInitialJoinPopulateZombies', enemyData)
    //Notify other players
    socket.broadcast.emit('newPlayer', socket.id);

    socket.on('requestServerForBullet', Bullet.handleCreateRequest);
    
}

Player.onDisconnect = function (socket) {
    Enemy.onPlayerDisconnect(socket.id);
    world.removeBody(Player.list[socket.id].body);
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
	self.used = false;
	self.hasCollided = false;
	self.body = new p2.Body({
		mass : 1,
		position : position,
		angle: angle,
		velocity: [Math.cos(angle/180*Math.PI) * self.maxspeed, Math.sin(angle/180*Math.PI) * self.maxspeed],
		id: self.id,
	});
	var bulletshape = new p2.Box({width:2, height:16});
	bulletshape.collisionGroup = BULLET;
	bulletshape.collisionMask = BULLET | ENEMY | BLOCK;
	self.body.addShape(bulletshape);
	world.addBody(self.body);
	self.timeAlive = 0;
	Bullet.list[self.id] = self;
	return self;
}

Bullet.list = {};

Bullet.destroyOldBullets = function(){
	for(var id in Bullet.list){
		if(Bullet.list[id].timeAlive > 60){
			Bullet.destroy(id);
		} else{
			Bullet.list[id].timeAlive++;
		}
	}
}

Bullet.handleCreateRequest = function(socketid){
    var player = Player.list[socketid];
    //var bullet = Bullet(player.angle, player.body.position);
    var angle = player.angle;
    var position = player.body.position;
    var distance = 500;

    var ray = new p2.Ray({
        mode: p2.Ray.ALL, // or ANY
        from: [position[0], position[1]],
        to: [position[0]+distance*Math.cos(angle/180*Math.PI), position[1]+distance*Math.sin(angle/180*Math.PI)],
        callback : function(result){
            // Get the hit point
            var hitPoint = p2.vec2.create();
            result.getHitPoint(hitPoint, ray);
            console.log('Hit point: ', hitPoint[0], hitPoint[1], ' at distance ' + result.getHitDistance(ray));

            if(result.body !== null && result.body.shapes[0].collisionGroup !== PLAYER){
                if(result.body.shapes[0].collisionGroup === ENEMY && Enemy.list[result.body.id]){
                    Enemy.list[result.body.id].decreaseHealth();
                }
                result.stop()
            }

        }
    });
    var result = new p2.RaycastResult();
    world.raycast(result, ray);


	// for(var i in SOCKET_LIST){
	// 	SOCKET_LIST[i].emit('bulletCreate', {id: bullet.id, 
 //                                            position: player.body.position,
 //                                            angle: player.angle});
	// }
}

Bullet.destroy = function(id){
	if(typeof Bullet.list[id] === 'undefined')
		return;
	world.removeBody(Bullet.list[id].body);
	delete Bullet.list[id];
    for(i in SOCKET_LIST){
        SOCKET_LIST[i].emit('deleteBullet', id);
    }
}

var Block = function(x,y,texture){
    var self = {};
    self.texture = texture;
    self.body = new p2.Body({
    	position:[x,y],
    	type: p2.Body.KINEMATIC
    });
    var blockShape = new p2.Box({width:BLOCKSIZE, height:BLOCKSIZE});
    blockShape.collisionGroup = BLOCK;
    blockShape.collisionMask = ENEMY | PLAYER | BULLET;
    self.body.addShape(blockShape);
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
    self.healthpoints = 100;

    self.angle = 0;

    self.body = new p2.Body({
    	mass:1,
    	position:[x,y],
    	id : self.id
    });


    var enemyshape = new p2.Box({width:BLOCKSIZE, height:BLOCKSIZE});
    enemyshape.collisionGroup = ENEMY;
    enemyshape.collisionMask = ENEMY | PLAYER | BLOCK | BULLET;
    self.body.addShape(enemyshape);
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

    self.decreaseHealth = function(){
    	self.healthpoints -= GUNDAMAGE;
    	if(self.healthpoints <= 0){
    		Enemy.destroy(self.id);
    	}
    }
    
    Enemy.list[self.id] = self;
    return self;
}

Enemy.list = {};

Enemy.initializeEnemy = function(playerid, x, y) {
    var enemy = Enemy(x, y, playerid);
    for(i in SOCKET_LIST){
        SOCKET_LIST[i].emit('createEnemy', {id: enemy.id, position: [x, y]});
    }
}

Enemy.randomGenerateEnemy = function() {    
    for(i in Player.list){ 
        var spawnSide = Math.floor((Math.random() * 4) + 1);   
        var x = 10;    
        var y = 10;    
        if(spawnSide == 0) {   
            x = 960;   
        }  
        else if(spawnSide == 1) {  
            x = 960;   
            y = 1070;  
        }  
        else if(spawnSide == 2) {  
            y = 540;   
        }  
        else { 
            x = 1910;  
            y = 540;   
        }  
        Enemy.initializeEnemy(i, x, y);    
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
    world.removeBody(Enemy.list[enemyid].body);
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
var zombieSpawnTimer = 0;

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

    if(zombieSpawnTimer >= 100){
        zombieSpawnTimer = 0;
        Enemy.randomGenerateEnemy();
    }
    zombieSpawnTimer++;
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


setInterval(function () {
    //function to path zombies
    for(var i in Enemy.list){
        var enemy = Enemy.list[i];
        enemy.update();
        //Check if enemy is out of bounds
        enemy.worldbounds();
    }

}, 1000/10);

var count2= 0;
// world.on("impact",function(evt){
//     var bodyA = evt.bodyA,
//         bodyB = evt.bodyB;
//     //If bullet is involved n collision
//     if(bodyA.shapes[0].collisionGroup === BULLET || bodyB.shapes[0].collisionGroup === BULLET){
// 	   	var bulletBody, otherBody;
// 	   	if (bodyA.shapes[0].collisionGroup === BULLET) {
// 	   		bulletBody = bodyA;
//             otherbody = bodyB;
// 	   	} else {
// 	    	bulletBody = bodyB;
// 	   		otherbody = bodyA;
// 	   	}

// 	   	//If bullet hit an enemy
// 	    if(bodyA.shapes[0].collisionGroup === ENEMY || bodyB.shapes[0].collisionGroup === ENEMY){
// 	   		console.log("Hitting zombie" + count2);
// 	   		count2++;
// 	   		if(typeof Bullet.list[bulletBody.id] !== 'undefined' && !Bullet.list[bulletBody.id].hasCollided){
	   			
// 		   		if(Enemy.list[otherbody.id]){
// 		   			Enemy.list[otherbody.id].decreaseHealth();
// 		   		}
// 		   	}
// 	    }
//         console.log("Bullet collision detected " + count2);
//         count2++;
//         if(typeof Bullet.list[bulletBody.id] !== 'undefined')
//        	    Bullet.destroy(bulletBody.id);
//     }
// });
