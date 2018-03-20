var socketHandler = require('./sockethandler.js');
var SOCKET_LIST = socketHandler.SOCKET_LIST;

var p2 = require('p2');
var Enemy = require('./enemy.js');
var Block = require('./block.js');
var world = require('./physicshandler.js')
var constants = require('./constants.js');
var Mathfunc = require('./mathfunc.js');

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

    

    //Avoid ground items
    // while(result.body !== null && result.body.shapes[0].collisionGroup === constants.GROUNDITEM){
    //     var remainingLength = distance - Math.abs(result.getHitDistance(ray));
    //     // Get the hit point
    //     var hitPoint = p2.vec2.create();
    //     result.getHitPoint(hitPoint, ray);
    //     ray.from = [hitPoint[0] + Math.cos(angle/180*Math.PI)*constants.GROUNDITEMSIZE*1.5, hitPoint[1] + Math.sin(angle/180*Math.PI)*constants.GROUNDITEMSIZE*1.5];
    //     console.log('Hit point: ', hitPoint[0], hitPoint[1], ' at distance ' + result.getHitDistance(ray));
    //     result.body === 
    //     world.raycast(result,ray);
    //}

    if(result.body !== null && result.body.shapes[0].collisionGroup === constants.ENEMY){
        if(Enemy.list[result.body.id]){
            killedEnemy = Enemy.list[result.body.id].decreaseHealth(constants.RIFLEDAMAGE);
        }
    }

    //If block
    if(result.body !== null && result.body.shapes[0].collisionGroup === constants.BLOCK){
        if(Block.list[result.body.id]){
            Block.list[result.body.id].decreaseHealth(constants.RIFLEDAMAGE);
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

            //If block
            if(result.body !== null && result.body.shapes[0].collisionGroup === constants.BLOCK){
                if(Block.list[result.body.id]){
                    Block.list[result.body.id].decreaseHealth(500);
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

GunHandler.rifleShootRequestTEST = function(angle, position){
    var distance = 800;
    var startx = position[0] + 50*Math.cos(angle/180*Math.PI);
    var starty = position[1] + 50*Math.sin(angle/180*Math.PI);
    var closestHitDistance = distance;
    var closestResult = null;
    var killedEnemy = false;

    var ray = new p2.Ray({
        mode: p2.Ray.ALL, // or ANY
        from: [startx, starty],
        to: [position[0]+distance*Math.cos(angle/180*Math.PI), position[1]+distance*Math.sin(angle/180*Math.PI)],
        callback: function(result){
            // Get the hit point
            var hitPoint = p2.vec2.create();
            result.getHitPoint(hitPoint, ray);
            var length = Math.abs(result.getHitDistance(ray));

            if(result.body !== null && result.body.shapes[0].collisionGroup !== constants.GROUNDITEM && length < closestHitDistance){
                closestResult = result;
                closestHitDistance = length;
            }
            
        }
    });

    var result = new p2.RaycastResult();
    world.raycast(result, ray);

    socketHandler.emitAll('createGunShot', {startx: startx, starty: starty, angle: angle, length: closestHitDistance});
    //If enemy
    if(closestResult !== null && closestResult.body.shapes[0].collisionGroup === constants.ENEMY){
        if(Enemy.list[closestResult.body.id]){
            killedEnemy = Enemy.list[closestResult.body.id].decreaseHealth(constants.RIFLEDAMAGE);
        }
    }
    //If block
    if(closestResult !== null && closestResult.body.shapes[0].collisionGroup === constants.BLOCK){
        if(Block.list[closestResult.body.id]){
            Block.list[closestResult.body.id].decreaseHealth(500);
        }
    }
    return killedEnemy;

}


// GunHandler.toolUseRequest = function(angle, position){
//     var distance = 64;
//     var startx = position[0];
//     var starty = position[1];
//     var destroyedBlock = false;
//     var ray = new p2.Ray({
//         mode: p2.Ray.ALL, // or ANY
//         from: [position[0], position[1]],
//         to: [position[0]+distance*Math.cos(angle/180*Math.PI), position[1]+distance*Math.sin(angle/180*Math.PI)],
//         callback: function(result){
//             var hitPoint = p2.vec2.create();
//             result.getHitPoint(hitPoint, ray);

//             //If block
//             if(result.body !== null && result.body.shapes[0].collisionGroup === constants.BLOCK){
//                 if(Block.list[result.body.id]){
//                     destroyedBlock = Block.list[result.body.id].decreaseHealth(constants.TOOLDAMAGETOBLOCK);
//                 }
//             }

//             if(destroyedBlock){
//                 return 'wood'
//             }

//         }
//     });
    
//     var result = new p2.RaycastResult();
//     world.raycast(result, ray);
//     var length = distance;
//     socketHandler.emitAll('createGunShot', {startx: startx, starty: starty, angle: angle, length: length});
//     return null;
    
// }

GunHandler.toolUseRequest = function(angle, position){
    var distance = 120;
    var startx = position[0] + 50*Math.cos(angle/180*Math.PI);
    var starty = position[1] + 50*Math.sin(angle/180*Math.PI);
    var destroyedBlock = false;

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

    //If block
    if(result.body !== null && result.body.shapes[0].collisionGroup === constants.BLOCK){
            if(Block.list[result.body.id]){
                destroyedBlock = Block.list[result.body.id].decreaseHealth(constants.TOOLDAMAGETOBLOCK);
            }
    }
    var length = Math.abs(result.getHitDistance(ray));

    socketHandler.emitAll('createGunShot', {startx: startx, starty: starty, angle: angle, length: length});
    if(destroyedBlock)
        return 'wood';
    return null;

}

module.exports = GunHandler;