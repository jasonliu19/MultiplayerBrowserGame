var Enemy = require('./enemy.js');
var Player = require('./player.js');
var Constants = require('./constants.js');
var Mathfunc = require('./mathfunc.js');

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
            //console.log('Initiate attack of  '+String(id)+'  zombie',self.initiateAttack);
            if (self.initiateAttack){
                self.attackDelayCounter ++;
                //console.log('Attack delay counter of  '+String(id)+'  zombie',self.attackDelayCounter);
                if (self.attackDelayCounter >= Constants.HITDELAY){
                    //console.log(self.attackTarget,self.attackTargetId===Enemy.list[id].playerid,self.attackDelayCounter,self.initiateAttack);
                    if (self.attackTarget === 'PLAYER'){
                        //console.log(Mathfunc.distance(self.body.position,Player.list[self.attackTargetId].body.position));
                        if (Mathfunc.distance(self.body.position,Player.list[self.attackTargetId].body.position) <= Constants.HITRADIUS){
                            Player.list[self.attackTargetId].decreaseHealth();
                        }
                    }
                    //add more else ifs for zombies hitting other things but I (David) would heavily suggest refactoring and restructuring
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