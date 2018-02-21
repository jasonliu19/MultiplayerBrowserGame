var socketHandler = require('./sockethandler.js');
var SOCKET_LIST = socketHandler.SOCKET_LIST;

var p2 = require('p2');
var Enemy = require('./enemy.js');
var world = require('./physicshandler.js')
var constants = require('./constants.js');

var GunHandler = {};
GunHandler.rifleShootRequest = function(angle, position){
    var distance = 500;
    var startx = position[0] + 50*Math.cos(angle/180*Math.PI);
    var starty = position[1] + 50*Math.sin(angle/180*Math.PI);

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
            Enemy.list[result.body.id].decreaseHealth();
        }
    }

    var length = Math.abs(result.getHitDistance(ray));

    socketHandler.emitAll('createGunShot', {startx: startx, starty: starty, angle: angle, length: length});


}

module.exports = GunHandler;