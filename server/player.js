var socketHandler = require('./sockethandler.js');

var p2 = require('p2');
var constants = require('./constants.js');
var world = require('./physicshandler.js');
var GunHandler = require('./gunhandler.js');
var BuildingManager = require('./buildingmanager.js');

var Player = function (id) {
    var self = {};
    self.id = id;

    self.pressingRight= false;
    self.pressingLeft= false;
    self.pressingDown= false;
    self.pressingUp= false;

    self.justDamaged = false;
    self.inContactWithEnemy = false;
    self.damageCooldownCounter = 0;;
    self.hp = 100;

    self.dead = false;
    self.respawnTimer = 0;

    self.equippedItem = 1;
    self.inventory = [null, 'rifle', 'shotgun', 'sniper', 'tool', 'wood', null, null, null, null];
    self.cooldowns = [0, 0, 0, 0, 0, 0, 0, 0];

    self.ammo = {
        rifle: 50,
        shotgun: 20,
        sniper: 10,
    }

    self.resources = {
        wood: 10,
    }

    self.killCount = 0;

    self.maxspeed = 150;
    self.angle = 0;
    self.body = new p2.Body({
    	mass:1,
    	position:[250,250],
        id: id,
    });
    var bodyShape = new p2.Box({width:constants.HUMANOIDSIZE, height:constants.HUMANOIDSIZE});
    bodyShape.collisionGroup = constants.PLAYER;
    bodyShape.collisionMask = constants.GROUNDITEM | constants.ENEMY | constants.BLOCK | constants.PLAYER;
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

    self.updateDamage = function(){
        if(self.justDamaged){
            self.damageCooldownCounter++;
        } else if (self.inContactWithEnemy){
            self.decreaseHealth();
        }


        if(self.damageCooldownCounter > 30){
            self.justDamaged = false;
            self.damageCooldownCounter = 0;
        }
    }

    self.updateCooldowns = function(){
        for(var i = 0; i < self.cooldowns.length; i++){
            if(self.cooldowns[i] > 0){
                self.cooldowns[i]--;
            }
        }
    }

    self.worldbounds = function () {
    	if (self.body.position[0] <= 0) 
    		if (self.body.velocity[0] < 0)
    			self.body.velocity[0] = 0;
    	if (self.body.position[0] >= constants.WORLDWIDTH)
    		if (self.body.velocity[0] > 0)
    			self.body.velocity[0] = 0;
    	if (self.body.position[1] <= 0)
    		if (self.body.velocity[1] < 0) 
    			self.body.velocity[1] = 0;
    	if (self.body.position[1] >= constants.WORLDHEIGHT)
    		if (self.body.velocity[1] > 0)
    			self.body.velocity[1] = 0;
    }

    self.update = function () {
        if(self.dead){
            self.updateRespawnTimer();
            return;
        }
        self.updateVel();
        self.worldbounds();
        self.updateDamage();
        self.updateCooldowns();
    }

    self.decreaseHealth = function(damage){
        if(!self.justDamaged){
            self.hp -= damage;
            self.justDamaged = true;
        }
        if(self.hp <= 0){
            self.die();
        }

    }

    self.decreaseAmmo = function(type){
        self.ammo[type]--;
    }

    self.destroy = function(){
        world.removeBody(self.body);
        delete Player.list[self.id];
    }

    self.die = function(){
        self.dead = true;
        self.respawnTimer = constants.RESPAWNTIME;
        self.body.velocity = [0,0];
        self.body.position = [250, -500];
        socketHandler.emitAll('playerDeath', self.id);
    }

    self.updateRespawnTimer = function(){
        self.respawnTimer--;
        if(self.respawnTimer <= 0){
            self.respawn();
        }
    }

    self.respawn = function(){
        self.hp = 100;
        self.dead = false;
        self.respawnTimer = 0;
        self.ammo = {
            rifle: 50,
            shotgun: 500,
            sniper: 500,
        }
        self.resources = {
            wood: 5,
        }
        self.body.position = [250, 250];
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
    socket.on('useRequest', function(cursorPosition){
        Player.handleUseRequest(socket.id, cursorPosition);
    });

    socket.on('inventoryChangeRequest', function(slotNumber){
        Player.handleInventoryChangeRequest(socket.id, slotNumber);
    });
}

Player.update = function(){
    for(var i in Player.list){
        var player = Player.list[i];
        player.update();
    }
}

Player.handleUseRequest = function(socketid, cursorPosition){
    //Ensure player hasn't left and is alive
    if(!(socketid in Player.list) || Player.list[socketid].dead)
        return;
    var player  = Player.list[socketid];
    var equipped = player.equippedItem;
    var inventory = player.inventory;
    var ammo = player.ammo;
    var cooldowns = player.cooldowns;
    //Check weapon equipped, if they have ammo, and if they just shot
    if(inventory[equipped] === 'rifle' && ammo.rifle > 0 && player.cooldowns[equipped] <= 0){
        player.decreaseAmmo('rifle');
        player.cooldowns[equipped] = constants.RIFLECOOLDOWN;
        var killedEnemy = GunHandler.rifleShootRequest(player.angle, player.body.position);
        if(killedEnemy){
            Player.list[socketid].killCount++;
        }
    } else if(inventory[equipped] === 'shotgun' && ammo.shotgun > 0 && player.cooldowns[equipped] <= 0){
        player.decreaseAmmo('shotgun');
        player.cooldowns[equipped] = constants.SHOTGUNCOOLDOWN;
        var killedCount = GunHandler.shotgunShootRequest(player.angle, player.body.position);
        if(killedCount > 0){
            Player.list[socketid].killCount += killedCount;
        }
    } else if(inventory[equipped] === 'sniper' && ammo.sniper > 0 && player.cooldowns[equipped] <= 0){
        player.decreaseAmmo('sniper');
        player.cooldowns[equipped] = constants.SNIPERCOOLDOWN;
        var killedCount = GunHandler.sniperShootRequest(player.angle, player.body.position);
        if(killedCount > 0){
            Player.list[socketid].killCount += killedCount;
        }
    } 
    else if (inventory[equipped] === 'tool' && player.cooldowns[equipped] <= 0){
        player.cooldowns[equipped] = constants.TOOLCOOLDOWN;
        var resourceCollected = GunHandler.toolUseRequest(player.angle, player.body.position);
        if (resourceCollected !== null){
            player.resources[resourceCollected]++;
        }
    } else if (inventory[equipped] === 'wood' && player.cooldowns[equipped] <= 0){
        player.cooldowns[equipped] = 0;
        if (player.resources['wood'] > 0){
            BuildingManager.placeWood(cursorPosition[0], cursorPosition[1]);
            player.resources['wood']--;
        }
    }
}

Player.handleInventoryChangeRequest = function(socketid, slotNumber){
//    console.log('change request: ' + slotNumber);
    if(slotNumber <= 0 || slotNumber > Player.list[socketid].inventory.length-1 || Player.list[socketid].inventory[slotNumber] == null)
        return;

    Player.list[socketid].equippedItem = slotNumber;
    // socketHandler.emitAll('inventoryChangeSuccess', {playerid: socketid, slotNumber: slotNumber});

}

Player.onDisconnect = function (socket) {
    Player.list[socket.id].destroy();
}

Player.generateCurrentStatusPackage = function(){
	var pack = {};
	for(var i in Player.list){
		pack[i] = {
			position : Player.list[i].body.position,
			angle : Player.list[i].angle,
			hp : Player.list[i].hp,
            ammo : Player.list[i].ammo,
            killCount : Player.list[i].killCount,
            equipped : Player.list[i].equippedItem,
		};
    }
	return pack;
}




module.exports = Player;