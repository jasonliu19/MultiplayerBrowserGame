var p2 = require('p2');
var world = require('./physicshandler.js');
var constants = require('./constants.js');

var Player = require('./player.js');
var Enemy = require('./enemy.js');
var GroundItem = require('./grounditem.js');

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

            if (otherBody.shapes[0].collisionGroup === constants.GROUNDITEM){
                try{
                    //Temporary, only for ammo with fixed quantity
                    Player.list[primaryBody.id].ammo.rifle += 50;
                    GroundItem.list[otherBody.id].destroy();

                }catch(error){
                    console.log(error);
                }
            }
        }
        //If block
        else if (orStatementHelper(bodyA, bodyB, constants.BLOCK)){
            bodiesArray = bodyAssignment(bodyA, bodyB, constants.BLOCK);
        }
        //If ground item
        else if (orStatementHelper(bodyA, bodyB, constants.GROUNDITEM)){
            bodiesArray = bodyAssignment(bodyA, bodyB, constants.GROUNDITEM);
        }
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