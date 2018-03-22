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

    self.initiateAttack = false;
    self.attackDelayCounter = 0;
    self.attackTarget = "";
    self.attackTargetId = "";

    self.angle = 0;

    self.body = new p2.Body({
    	mass:1,
    	position:[x,y],
    	id : self.id
    });


    var enemyshape = new p2.Box({width:constants.BLOCKSIZE, height:constants.BLOCKSIZE});
    enemyshape.collisionGroup = constants.ENEMY;
    enemyshape.collisionMask = constants.PLAYER | constants.BLOCK | constants.BULLET;
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
    

    self.decreaseHealth = function(damage){
    	var isDead = false;
        self.healthpoints -= damage;
    	if(self.healthpoints <= 0){
    		Enemy.destroy(self.id);
            isDead = true;
    	}
        return isDead;
    }
    
    self.attackSequence = function(target, targetId){
        self.initiateAttack = true;
        self.attackTarget = target;
        self.attackTargetId = targetId;
        //console.log('******************',self.initiateAttack,self.attackTarget,self.attackTargetId);
    }

    Enemy.list[self.id] = self;
    return self;
}

Enemy.opposeBodies = new Set([constants.PLAYER, constants.BLOCK]);
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
    socket.emit('onInitialJoinPopulateZombies', enemyData);
}

Enemy.test = 'abcd';

module.exports = Enemy;
