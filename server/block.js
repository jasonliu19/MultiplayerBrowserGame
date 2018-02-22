var socketHandler = require('./sockethandler.js');
var p2 = require('p2');
var world = require('./physicshandler.js');
var constants = require('./constants.js');
var BLOCKSIZE = constants.BLOCKSIZE;

var Block = function(x,y,texture){
    var self = {};
    self.texture = texture;
    self.id = Math.random() * 6;
    self.body = new p2.Body({
    	position:[x,y],
    	type: p2.Body.KINEMATIC,
        id: self.id,
    });
    var blockShape = new p2.Box({width:BLOCKSIZE, height:BLOCKSIZE});
    blockShape.collisionGroup = constants.BLOCK;
    blockShape.collisionMask = constants.ENEMY | constants.PLAYER | constants.BULLET;
    self.body.addShape(blockShape);
    world.addBody(self.body);

    self.hp = 500;

    self.decreaseHealth = function(damage){
        var isDead = false;
        self.hp -= damage;
        if(self.hp <= 0){
            Block.destroy(self.id);
            isDead = true;
        }
        return isDead;
    }

    Block.list[self.id] = self;
    return self;
}


Block.list = {};

Block.generateMapData = function(){
	var pack = {};
	for(var i in Block.list){
		pack[i] = {
            texture: Block.list[i].texture, 
            position: Block.list[i].body.position
        };
	}
	return pack;
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

Block.createMap = function(){
    Block.createLine(0, 600, 10, 'right', 'tree');
    Block.createLine(1000, 0, 10, 'down', 'grass');
}

Block.onPlayerConnect = function(socket){
    var mapData = Block.generateMapData();
    socket.emit('createMap', mapData);
}

Block.destroy = function (id) {
    world.removeBody(Block.list[id].body);
    delete Block.list[id];
    socketHandler.emitAll('destroyBlock', id);
}

module.exports = Block;