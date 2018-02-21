var p2 = require('p2');
var world = require('./physicshandler.js');
var constants = require('./constants.js');
var BLOCKSIZE = constants.BLOCKSIZE;

var Block = function(x,y,texture){
    var self = {};
    self.texture = texture;
    self.body = new p2.Body({
    	position:[x,y],
    	type: p2.Body.KINEMATIC
    });
    var blockShape = new p2.Box({width:BLOCKSIZE, height:BLOCKSIZE});
    blockShape.collisionGroup = constants.BLOCK;
    blockShape.collisionMask = constants.ENEMY | constants.PLAYER | constants.BULLET;
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

Block.createMap = function(){
    Block.createLine(0, 600, 10, 'right', 'tree');
    Block.createLine(1000, 0, 10, 'down', 'grass');
}

Block.onPlayerConnect = function(socket){
    var mapData = Block.generateMapData();
    socket.emit('createMap', mapData);
}

module.exports = Block;