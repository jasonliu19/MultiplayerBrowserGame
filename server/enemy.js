var socketHandler = require('./sockethandler.js');

var p2 = require('p2');
var constants = require('./constants.js');
var world = require('./physicshandler.js');


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


    var enemyshape = new p2.Box({width:constants.BLOCKSIZE, height:constants.BLOCKSIZE});
    enemyshape.collisionGroup = constants.ENEMY;
    enemyshape.collisionMask = constants.ENEMY | constants.PLAYER | constants.BLOCK | constants.BULLET;
    self.body.addShape(enemyshape);
    world.addBody(self.body);


    
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
    

    self.decreaseHealth = function(){
    	self.healthpoints -= constants.GUNDAMAGE;
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
    socketHandler.emitAll('createEnemy', {id: enemy.id, position: [x, y]});
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

Enemy.onPlayerDisconnect = function(socket){
    var playerid = socket.id;
    for(var i in Enemy.list){
        if(Enemy.list[i].playerid === playerid){
            Enemy.destroy(i);
        }
    }
}

Enemy.destroy = function(enemyid){
    world.removeBody(Enemy.list[enemyid].body);
    delete Enemy.list[enemyid];
    socketHandler.emitAll('deleteEnemy', enemyid);
}

Enemy.onPlayerConnect = function(socket){
    Enemy.initializeEnemy(socket.id,20,20);
    
    var enemyData = Enemy.generateCurrentStatusPackage();
    socket.emit('onInitialJoinPopulateZombies', enemyData)
}

Enemy.test = 'abcd';

module.exports = Enemy;