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
var CollisionHandler = require('./server/collisionhandler.js');

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
var wavePauseTime = 60000;
var waveLength = 30000;
var waveNumber = 1;

setInterval(function () {
	var delta = Date.now() - lastTime;
	lastTime = Date.now();
    Player.update();
    world.step(delta/1000);
    CollisionHandler.update();

    // limit time between waves to be 10 seconds at shortest
    if(zombieSpawnTimer >= wavePauseTime && wavePauseTime >= 10000) {
        zombieSpawnTimer = 0;
        waveLength += 3000;
        waveNumber++;
        // spawn waveNumber extra enemies at the beginning of each wave
        for(i = 0; i < waveNumber; i++) {
            for(j = 0; j < waveNumber; j++) {
                EnemyManager.randomGenerateEnemy();
            }
        }
    }
    else if(zombieSpawnTimer >= wavePauseTime) {
        // spawn waveNumber extra enemies at the beginning of each wave
        for(i = 0; i < waveNumber; i++) {
            for(j = 0; j < waveNumber; j++) {
                EnemyManager.randomGenerateEnemy();
            }
        }
        zombieSpawnTimer = 0;
        wavePauseTime -= 3000;
        waveLength += 3000;
        waveNumber++;
    }
    else if(zombieSpawnTimer%100 == 0 && zombieSpawnTimer <= waveLength){
        EnemyManager.randomGenerateEnemy();
    }
    if(zombieSpawnTimer == 0){
        EnemyManager.randomGenerateEnemy();
    }
    if(zombieSpawnTimer%500 == 0){
        GroundItem.randomlySpawnAmmo();
    }

    //Check if server is empty
    var isEmpty = true;
    for(var i in Player.list) {
        if (Player.list.hasOwnProperty(i)) {
           isEmpty = false;
           break;
        }
    }

    if(isEmpty){
        wavePauseTime = 60000;
        waveLength = 30000;
        waveNumber = 1;
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
}, 5000);


setInterval(function () {
	EnemyManager.update();
}, 200);





