var Enemy = require('./enemy.js');
var Player = require('./player.js');
var constants = require('./constants.js');
var Mathfunc = require('./mathfunc.js');
var Block = require('./block.js');

var EnemyManager = {};

EnemyManager.updateVelocity = function(){
    for(var id in Enemy.list){
    	try{
	    	var playerid = Enemy.list[id].playerid;
	    	var self = Enemy.list[id];
	        if(Player.list[playerid].body.position[0] > self.body.position[0])
	            self.body.velocity[0] = self.maxspeed;
	        else if(Player.list[playerid].body.position[0] < self.body.position[0])
	            self.body.velocity[0] = -self.maxspeed;
	        else
	            self.body.velocity[0] = 0;

	        if(Player.list[playerid].body.position[1] < self.body.position[1])
	            self.body.velocity[1] = -self.maxspeed;
	        else if(Player.list[playerid].body.position[1] > self.body.position[1])
	            self.body.velocity[1] = self.maxspeed;
	        else
	            self.body.velocity[1] = 0;
	    } catch (error){
	    	console.log(error);
	    }
	}
}

EnemyManager.updateAttack = function(){
    for (var id in Enemy.list){
        try{
            var self = Enemy.list[id];
            
            if (self.initiateAttack){
                self.attackDelayCounter ++;
                
                if (self.attackDelayCounter >= constants.HITDELAY){
                    
                    if (self.attackTarget === constants.PLAYER){
                        playerBody = Player.list[self.attackTargetId];
                        if (Mathfunc.distance(self.body.position,playerBody.body.position) <= constants.HITRADIUS){
                            playerBody.decreaseHealth(constants.ENEMYDAMAGE);
                        }
                    }

                    else if (self.attackTarget === constants.BLOCK){
                        blockBody = Block.list[self.attackTargetId];
                        if (Mathfunc.distance(self.body.position,blockBody.body.position) <= constants.HITRADIUS){
                            blockBody.decreaseHealth(constants.ENEMYDAMAGE);
                        }
                    }
                    //add more else ifs for zombies hitting other things but refactoring and restructuring is heavily recommended
                    self.attackDelayCounter = 0;
                    self.initiateAttack = false;
                }
            }
        } catch (error){
            console.log(error);
        }
    }
}

EnemyManager.update = function(command){
	EnemyManager.updateVelocity();
    EnemyManager.updateAttack();
}

EnemyManager.randomGenerateEnemy = function() {    
    for(i in Player.list){ 
        var spawnSide = Math.floor((Math.random() * 4) + 1);   
        var x = 10;    
        var y = 10;    
        if(spawnSide == 0) {   
            x = 960;   
        }  
        else if(spawnSide == 1) {  
            x = 960;   
            y = 1070;  
        }  
        else if(spawnSide == 2) {  
            y = 540;   
        }  
        else { 
            x = 1910;  
            y = 540;   
        }  
        Enemy.initializeEnemy(i, x, y);    
    }       
}


module.exports = EnemyManager;