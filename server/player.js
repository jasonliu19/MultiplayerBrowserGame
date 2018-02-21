var socketHandler = require('./sockethandler.js');

var p2 = require('p2');
var constants = require('./constants.js');
var world = require('./physicshandler.js');
var GunHandler = require('./gunhandler.js');


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

    self.healthpoints = 100;

    var bodyShape = new p2.Box({width:64, height:64});
    bodyShape.collisionGroup = constants.PLAYER;
    bodyShape.collisionMask = constants.ENEMY | constants.BLOCK | constants.PLAYER;
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

    self.decreaseHealth = function(){
        self.healthpoints -= ENEMYDAMAGE;
    }

    Player.list[id] = self;
    return self;
}

Player.list = {};

Player.onConnect = function (socket) {
    console.log("Socket connected with ID: " + socket.id);

    var otherPlayersData = Player.generateCurrentStatusPackage();
    socket.emit('onInitialJoinPopulatePlayers', otherPlayersData);

    var player = Player(socket.id);
    socket.on('updateServerOnMainPlayer', function (data) {
        player.pressingLeft = data.inputs.left;
        player.pressingRight = data.inputs.right;
        player.pressingDown = data.inputs.down;
        player.pressingUp = data.inputs.up;
        player.angle = data.angle;
    });
    

    //Notify other players
    socket.broadcast.emit('newPlayer', socket.id);
    socket.on('rifleShootRequest', Player.handleShootRequest);
}

Player.handleShootRequest = function(socketid){
    if(!(socketid in Player.list))
        return;
    GunHandler.rifleShootRequest(Player.list[socketid].angle, Player.list[socketid].body.position);
}

Player.onDisconnect = function (socket) {
    world.removeBody(Player.list[socket.id].body);
    delete Player.list[socket.id];
}

Player.generateCurrentStatusPackage = function(){
	var pack = {};
	for(var i in Player.list){
		pack[i] = {
			position : Player.list[i].body.position,
			angle : Player.list[i].angle,
			healthpoints : Player.list[i].healthpoints,
		};
    }
	return pack;
}

Player.test = 'testing player';

Player.getList = function(){return Player.list};

module.exports = Player;