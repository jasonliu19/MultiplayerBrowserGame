var socketHandler = require('./sockethandler.js');
var SOCKET_LIST = socketHandler.SOCKET_LIST;

var p2 = require('p2');
var Enemy = require('./enemy.js');
var Block = require('./block.js');
var world = require('./physicshandler.js')
var constants = require('./constants.js');

var GunHandler = {};
GunHandler.rifleShootRequest = function(angle, position){
    var distance = 800;
    var startx = position[0] + 50*Math.cos(angle/180*Math.PI);
    var starty = position[1] + 50*Math.sin(angle/180*Math.PI);
    var killedEnemy = false;

    var ray = new p2.Ray({
        mode: p2.Ray.CLOSEST, // or ANY
        from: [startx, starty],
        to: [position[0]+distance*Math.cos(angle/180*Math.PI), position[1]+distance*Math.sin(angle/180*Math.PI)],
    });
    var result = new p2.RaycastResult();
    world.raycast(result, ray);

    // Get the hit point
    var hitPoint = p2.vec2.create();
    result.getHitPoint(hitPoint, ray);
    //console.log('Hit point: ', hitPoint[0], hitPoint[1], ' at distance ' + result.getHitDistance(ray));

    if(result.body !== null && result.body.shapes[0].collisionGroup === constants.ENEMY){
        if(Enemy.list[result.body.id]){
            killedEnemy = Enemy.list[result.body.id].decreaseHealth(constants.RIFLEDAMAGE);
        }
    }

    var length = Math.abs(result.getHitDistance(ray));

    socketHandler.emitAll('createGunShot', {startx: startx, starty: starty, angle: angle, length: length});
    return killedEnemy;

}


GunHandler.shotgunShootRequest = function(angle, position){
    var distance = 500;
    var startx = position[0] + 50*Math.cos(angle/180*Math.PI);
    var starty = position[1] + 50*Math.sin(angle/180*Math.PI);
    var killCount = 0;
    var killedEnemy = false;

    for(var offset = -6; offset <= 6; offset+=3){
        killedEnemy = false;
        var newAngle = angle + offset;
        var ray = new p2.Ray({
            mode: p2.Ray.CLOSEST, // or ANY
            from: [startx, starty],
            to: [position[0]+distance*Math.cos(newAngle/180*Math.PI), position[1]+distance*Math.sin(newAngle/180*Math.PI)],
        });
        var result = new p2.RaycastResult();
        world.raycast(result, ray);

        // Get the hit point
        var hitPoint = p2.vec2.create();
        result.getHitPoint(hitPoint, ray);

        //If enemy
        if(result.body !== null && result.body.shapes[0].collisionGroup === constants.ENEMY){
            if(Enemy.list[result.body.id]){
                killedEnemy = Enemy.list[result.body.id].decreaseHealth(constants.SHOTGUNDAMAGE);
            }
        }

        //If block
        if(result.body !== null && result.body.shapes[0].collisionGroup === constants.BLOCK){
            if(Block.list[result.body.id]){
                Block.list[result.body.id].decreaseHealth(constants.SHOTGUNDAMAGE);
            }
        }

        if(killedEnemy)
            killCount++;

        var length = Math.abs(result.getHitDistance(ray));
        socketHandler.emitAll('createGunShot', {startx: startx, starty: starty, angle: newAngle, length: length});
    }

    return killCount;

}

GunHandler.sniperShootRequest = function(angle, position){
    var distance = 1000;
    var startx = position[0] + 50*Math.cos(angle/180*Math.PI);
    var starty = position[1] + 50*Math.sin(angle/180*Math.PI);
    var killCount = 0;
    var killedEnemy = false;

    var ray = new p2.Ray({
        mode: p2.Ray.ALL, // or ANY
        from: [startx, starty],
        to: [position[0]+distance*Math.cos(angle/180*Math.PI), position[1]+distance*Math.sin(angle/180*Math.PI)],
        callback: function(result){
            killedEnemy = false;
            // Get the hit point
            var hitPoint = p2.vec2.create();
            result.getHitPoint(hitPoint, ray);
           
            //Check if enemy was hit
            if(result.body !== null && result.body.shapes[0].collisionGroup === constants.ENEMY){
                if(Enemy.list[result.body.id]){
                    killedEnemy = Enemy.list[result.body.id].decreaseHealth(constants.SNIPERDAMAGE);
                }
            }

            if(killedEnemy)
                killCount++;
        }
    });
    
    var result = new p2.RaycastResult();
    world.raycast(result, ray);
    var length = distance;//Math.abs(result.getHitDistance(ray));
    socketHandler.emitAll('createGunShot', {startx: startx, starty: starty, angle: angle, length: length});

    return killCount;

}

module.exports = GunHandler;