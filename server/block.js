var socketHandler = require('./sockethandler.js');
var p2 = require('p2');
var world = require('./physicshandler.js');
var constants = require('./constants.js');
var mathfunc = require('./mathfunc.js');
var BLOCKSIZE = constants.BLOCKSIZE;

var Block = function(x,y,texture){
    var key = String(x)+'.'+String(y);
    if (!(key in Block.occupationList)){
        var self = {};
        self.texture = texture;
        self.id = Math.random() * 6;
        self.positionKey = key;
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
        Block.count++;
        Block.occupationList[key];
        return self;
    }
}


Block.list = {};
Block.count = 0;
Block.occupationList = {};

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

Block.initMap = function(){
    // Block.createLine(0, 600, 10, 'right', 'tree');
    // Block.createLine(1000, 0, 10, 'down', 'grass');
    while(Block.count < 35){
        //Force block to be created on a grid
        var randx = Math.floor(mathfunc.randomInt(0,constants.WORLDWIDTH)/BLOCKSIZE)*BLOCKSIZE;
        var randy = Math.floor(mathfunc.randomInt(0,constants.WORLDHEIGHT)/BLOCKSIZE)*BLOCKSIZE;
        Block(randx, randy, 'tree');
    }
}

Block.create = function (x,y, texture) {
    var block = Block(x, y, texture);
    socketHandler.emitAll('createBlock', {position: block.body.position, texture: texture, id: block.id});
}


Block.createRandomTrees = function(){
    while(Block.count < 35){
        //Force block to be created on a grid
        var randx = Math.floor(mathfunc.randomInt(0,constants.WORLDWIDTH)/BLOCKSIZE)*BLOCKSIZE;
        var randy = Math.floor(mathfunc.randomInt(0,constants.WORLDHEIGHT)/BLOCKSIZE)*BLOCKSIZE;
        Block.create(randx, randy, 'tree');
    }    
}

Block.onPlayerConnect = function(socket){
    var mapData = Block.generateMapData();
    socket.emit('createMap', mapData);
}

Block.destroy = function (id) {
    world.removeBody(Block.list[id].body);
    delete Block.occupationList[Block.list[id].positionKey];
    delete Block.list[id];
    Block.count--;
    socketHandler.emitAll('destroyBlock', id);
}

Block.update = function () {
    Block.createRandomTrees();
}

module.exports = Block;