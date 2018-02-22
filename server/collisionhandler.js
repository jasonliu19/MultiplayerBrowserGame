var p2 = require('p2');
var world = require('./physicshandler.js');
var constants = require('./constants.js');

var Player = require('./player.js');
var Enemy = require('./enemy.js');

world.on("beginContact",function(evt){
    var bodyA = evt.bodyA,
        bodyB = evt.bodyB;
    //If player
    if(bodyA.shapes[0].collisionGroup === constants.PLAYER || bodyB.shapes[0].collisionGroup === constants.PLAYER){
	   	var playerBody, otherBody;
	   	if (bodyA.shapes[0].collisionGroup === constants.PLAYER) {
	   		playerBody = bodyA;
            otherbody = bodyB;
	   	} else {
	    	playerBody = bodyB;
	   		otherbody = bodyA;
	   	}

	   	//If player hit enemy
    	if (otherbody.shapes[0].collisionGroup === constants.ENEMY){
            try{
            	Player.list[playerBody.id].inContactWithEnemy = true;
            }catch(error){
            	console.log(error);
            }
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
            otherbody = bodyB;
	   	} else {
	    	playerBody = bodyB;
	   		otherbody = bodyA;
	   	}

	   	//If player hit enemy
    	if (otherbody.shapes[0].collisionGroup === constants.ENEMY){
            try{
            	Player.list[playerBody.id].inContactWithEnemy = false;
            }catch(error){
            	console.log("Player left while being attacked");
            }
        }
    }
});