//External modules
var p2 = require('p2');
//Internal modules
var socketHandler = require('./server/sockethandler.js');
var Player = require('./server/player.js');
var Enemy = require('./server/enemy.js');
var EnemyManager = require('./server/enemymanager.js');
var constants = require('./server/constants.js');
var Block = require('./server/block.js');
var world = require('./server/physicshandler.js');

var SOCKET_LIST = socketHandler.SOCKET_LIST;
var io = socketHandler.io;

var lastConnectedSocket = null;

Block.createMap();
setInterval(function () {
    if(lastConnectedSocket != socketHandler.getLastConnectedSocket()){
        var socket = socketHandler.getLastConnectedSocket();
        lastConnectedSocket = socket;
        SOCKET_LIST[socket.id] = socket;
        Player.onConnect(socket);
        Enemy.onPlayerConnect(socket);
        Block.onPlayerConnect(socket);
        socket.on('disconnect', function () {
            socket.broadcast.emit('playerDisconnect', socket.id);
            Enemy.onPlayerDisconnect(socket);
            Player.onDisconnect(socket);
            delete SOCKET_LIST[socket.id];
        });
    }
}, 1000/10);

//Don't need to touch stuff below here
//Handle initial socket connection


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
	// Bullet.destroyOldBullets();

    if(zombieSpawnTimer >= 100){
        zombieSpawnTimer = 0;
        EnemyManager.randomGenerateEnemy();
    }
    zombieSpawnTimer++;
}, 1000/60);

//Update clients loop
setInterval(function () {
    for(var i in SOCKET_LIST){
        try {
            var pack = Player.generateCurrentStatusPackage();
            SOCKET_LIST[i].emit('updateClientOnPlayers', pack);
            pack = Enemy.generateCurrentStatusPackage();
            SOCKET_LIST[i].emit('updateClientOnEnemies', pack);
        }
        catch(error) {
          console.log(error);
        }
    }
}, 1000/40);


setInterval(function () {
    //function to path zombies
    EnemyManager.update();
    // for(var i in Enemy.list){
    //     var enemy = Enemy.list[i];
    //     enemy.update();
    //     //Check if enemy is out of bounds
    //     enemy.worldbounds();
    // }

}, 1000/10);

// world.on("impact",function(evt){
//     var bodyA = evt.bodyA,
//         bodyB = evt.bodyB;
//     //If player
//     if(bodyA.shapes[0].collisionGroup === PLAYER || bodyB.shapes[0].collisionGroup === PLAYER){
// 	   	var playerBody, otherBody;
// 	   	if (bodyA.shapes[0].collisionGroup === PLAYER) {
// 	   		playerBody = bodyA;
//             otherbody = bodyB;
// 	   	} else {
// 	    	playerBody = bodyB;
// 	   		otherbody = bodyA;
// 	   	}

// 	   	//If player hit enemy
//     	if (otherbody.shapes[0].collisionGroup === ENEMY){

//         }
//     }
// });
