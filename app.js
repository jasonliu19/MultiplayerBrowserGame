//External modules
var p2 = require('p2');
//Internal modules
var socketHandler = require('./server/sockethandler.js');
var Player = require('./server/player.js');
var Enemy = require('./server/enemy.js');
var EnemyManager = require('./server/enemymanager.js');
var constants = require('./server/constants.js');
var Block = require('./server/block.js');
var GroundItem = require('./server/grounditem.js');
var world = require('./server/physicshandler.js');
require('./server/collisionhandler.js');

var SOCKET_LIST = socketHandler.SOCKET_LIST;
var io = socketHandler.io;

var lastConnectedSocket = null;

Block.initMap();
setInterval(function () {
    if(lastConnectedSocket != socketHandler.getLastConnectedSocket()){
        var socket = socketHandler.getLastConnectedSocket();
        lastConnectedSocket = socket;
        SOCKET_LIST[socket.id] = socket;
        Player.onConnect(socket);
        Enemy.onPlayerConnect(socket);
        Block.onPlayerConnect(socket);
        GroundItem.onPlayerConnect(socket);
        socket.on('disconnect', function () {
            socket.broadcast.emit('playerDisconnect', socket.id);
            Enemy.onPlayerDisconnect(socket);
            Player.onDisconnect(socket);
            delete SOCKET_LIST[socket.id];
        });
    }
}, 1000/10);



//Physics loop
var lastTime = Date.now();
var zombieSpawnTimer = 0;

setInterval(function () {
	var delta = Date.now() - lastTime;
	lastTime = Date.now();
	for(var i in Player.list){
        var player = Player.list[i];
        player.update();
    }
    world.step(delta/1000);

    if(zombieSpawnTimer >= 100){
        zombieSpawnTimer = 0;
        EnemyManager.randomGenerateEnemy();
        GroundItem.randomlySpawnAmmo();
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
    Block.update();
}, 2000);


setInterval(function () {
	EnemyManager.update();
}, 200);





