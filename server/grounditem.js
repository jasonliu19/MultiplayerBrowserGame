var socketHandler = require('./sockethandler.js');

var p2 = require('p2');
var constants = require('./constants.js');
var world = require('./physicshandler.js');

var GroundItem = function(category, type, position, quantity){
	var self = {};
	self.id = Math.random()*5;
	self.category = category;
	self.type = type;
	self.quantity = quantity;
    self.body = new p2.Body({
    	type: p2.Body.KINEMATIC,
    	position:position,
        id: self.id,
    });
    var bodyShape = new p2.Box({width:constants.GROUNDITEMSIZE, height:constants.GROUNDITEMSIZE});
    bodyShape.collisionGroup = constants.GROUNDITEM;
    bodyShape.collisionMask = constants.PLAYER;
    self.body.addShape(bodyShape);
    world.addBody(self.body);

    self.destroy = function(){
	    world.removeBody(self.body);
	    delete GroundItem.list[self.id];
	    socketHandler.emitAll('destroyGroundItem', self.id);
	    GroundItem.count--;
	}

	GroundItem.list[self.id] = self;
	return self;
}

GroundItem.list = {};
GroundItem.count = 0;

GroundItem.generateCurrentStatusPackage = function(){
	var pack = {};
	for(var i in GroundItem.list){
		pack[i] = {
			position : GroundItem.list[i].body.position,
			category : GroundItem.list[i].category,
			type : GroundItem.list[i].type
		};
    }
	return pack;
}

GroundItem.randomlySpawnAmmo = function(){
	if(GroundItem.count > 50)
		return;
	var randx = Math.random()*constants.WORLDWIDTH;
	var randy = Math.random()*constants.WORLDHEIGHT;
	var item = GroundItem('ammo', 'rifleammo', [randx,randy], 50);
	socketHandler.emitAll('createAmmo', {type: 'rifleammo', position: item.body.position, id: item.id});
	GroundItem.count++;
}

GroundItem.onPlayerConnect = function(socket){
	var pack = GroundItem.generateCurrentStatusPackage();
    socket.emit('onInitialJoinPopulateGroundItems', pack);
}

module.exports = GroundItem;
