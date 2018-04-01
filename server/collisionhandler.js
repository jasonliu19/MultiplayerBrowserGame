var p2 = require('p2');
var world = require('./physicshandler.js');
var constants = require('./constants.js');

var Player = require('./player.js');
var Enemy = require('./enemy.js');
var GroundItem = require('./grounditem.js');
var Block = require('./block.js');

//Helper functions
function orStatementHelper(bodyA, bodyB, value){
    return bodyA.shapes[0].collisionGroup === value || bodyB.shapes[0].collisionGroup === value;
}

function bodyAssignment(bodyA, bodyB, value){
    var primaryBody,
        otherBody;
    if (bodyA.shapes[0].collisionGroup === value){
        primaryBody = bodyA;
        otherBody = bodyB;
    }
    else{
        primaryBody = bodyB;
        otherBody = bodyA;
    }

    return [primaryBody, otherBody];
}

//Main functions
world.on("beginContact",function(evt){
    var bodyA = evt.bodyA,
        bodyB = evt.bodyB;

    var bodiesArray;

    var primaryBody,
        otherBody;
    if (bodyA.shapes[0].collisionGroup !== bodyB.shapes[0].collisionGroup){
        //If enemy
        if (orStatementHelper(bodyA, bodyB, constants.ENEMY)){
            bodiesArray = bodyAssignment(bodyA, bodyB, constants.ENEMY);
            primaryBody = bodiesArray[0];
            otherBody = bodiesArray[1];
            
            //Check if otherBody is a valid target (in list of valid targets)
            if (Enemy.opposeBodies.has(otherBody.shapes[0].collisionGroup)){
                try{
                    /*
                    if (otherBody.shapes[0].collisionGroup === constants.PLAYER){
                        Player.list[playerBody.id].inContactWithEnemy = true; 
                    }
                    */// Just in case we still need this
                    Enemy.list[primaryBody.id].attackSequence(otherBody.shapes[0].collisionGroup,otherBody.id);
                }catch(error){
                    console.log(error);
                }
            }
        }
        //If player
        else if (orStatementHelper(bodyA, bodyB, constants.PLAYER)){
            bodiesArray = bodyAssignment(bodyA, bodyB, constants.PLAYER);
            primaryBody = bodiesArray[0];
            otherBody = bodiesArray[1];

            // if (otherBody.shapes[0].collisionGroup === constants.GROUNDITEM){
            //     try{
            //         //Temporary, only for ammo with fixed quantity
            //         Player.list[primaryBody.id].ammo.rifle += 50;
            //         GroundItem.list[otherBody.id].destroy();

            //     }catch(error){
            //         console.log(error);
            //     }
            // }
        }
        //If block
        else if (orStatementHelper(bodyA, bodyB, constants.BLOCK)){
            bodiesArray = bodyAssignment(bodyA, bodyB, constants.BLOCK);
        }
        // //If ground item
        // else if (orStatementHelper(bodyA, bodyB, constants.GROUNDITEM)){
        //     bodiesArray = bodyAssignment(bodyA, bodyB, constants.GROUNDITEM);
        // }
    }
});

world.on("endContact",function(evt){
    var bodyA = evt.bodyA,
        bodyB = evt.bodyB;
    //If player
    if(bodyA.shapes[0].collisionGroup === constants.PLAYER || bodyB.shapes[0].collisionGroup === constants.PLAYER){
	   	var playerBody, otherBody;
	   	if (bodyA.shapes[0].collisionGroup === constants.PLAYER) {
	   		playerBody = bodyA;
            otherBody = bodyB;
	   	} else {
	    	playerBody = bodyB;
	   		otherBody = bodyA;
	   	}

	   	//If player hit enemy
    	if (otherBody.shapes[0].collisionGroup === constants.ENEMY){
            try{
            	Player.list[playerBody.id].inContactWithEnemy = false;
            }catch(error){
            	console.log("Player left while being attacked");
            }
        }
    }
});

var CollisionHandler = {};


//p1, p2 are positions of the objects in array form [x,y]
//s1, s2 are sizes of the objects in array form [x,y]
CollisionHandler.checkOverlap = function(p1, p2, s1, s2){
    if(p1[0] + s1[0] < p2[0] - s2[0]){
        return false
    }
    if(p1[0] - s1[0] > p2[0] + s2[0]){
        return false
    }

    if(p1[1] + s1[1] < p2[1] - s2[1]){
        return false
    }

    if(p1[1] - s1[1] > p2[1] + s2[1]){
        return false
    }

    return true;
}

//O(nm) time where n is # ground items and m is # players
CollisionHandler.updateGroundItems = function(){
    for(var i in GroundItem.list){
        var item = GroundItem.list[i];
        var itempos = item.position;
        var itemsize = [constants.GROUNDITEMSIZE, constants.GROUNDITEMSIZE];
        for(var j in Player.list){
            var player = Player.list[j];
            var playerpos = player.body.position;
            var playersize = [constants.HUMANOIDSIZE, constants.HUMANOIDSIZE];
            if(CollisionHandler.checkOverlap(playerpos, itempos, playersize, itemsize)){
                try{
                    if(item.type === 'rifleammo'){
                        player.ammo.rifle += item.quantity;
                    } else if (item.type === 'shotgunammo'){
                        player.ammo.shotgun += item.quantity;
                    } else if (item.type === 'sniperammo'){
                        player.ammo.sniper += item.quantity;
                    }
                    item.destroy();

                }catch(error){
                    console.log(error);
                }
            }
        }
    }   
}

CollisionHandler.update = function(){
    CollisionHandler.updateGroundItems();
}

module.exports = CollisionHandler;