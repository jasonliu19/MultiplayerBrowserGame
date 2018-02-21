// Player.update = function () {
//     var pack = [];
//     for(var i in Player.list){
//         var player = Player.list[i];
//         player.update();
//         pack.push({
//             x:player.x,
//             y:player.y,
//             id:player.id,
//         });

//     }
//     return pack;
// }
    // Player.updateTargetPos = function(newPos){
    //     Player.thisPlayer.targetX = newPos[0];
    //     Player.thisPlayer.targetY = newPos[1];
    // }

    // Player.interpolateMainPlayer = function (){
    //     var oldX = Player.thisPlayer.gameobject.body.x;
    //     var oldY = Player.thisPlayer.gameobject.body.y;
    //     var targX = Player.thisPlayer.targetX;
    //     var targY = Player.thisPlayer.targetY;
    //     var stationaryX = Player.thisPlayer.gameobject.x === 0;
    //     var stationaryY = Player.thisPlayer.gameobject.body.velocity.y === 0;
    //     Player.thisPlayer.gameobject.body.x = targX;
    //     Player.thisPlayer.gameobject.body.y = targY;
    //     //Reenable for interpolation
    //     if(Math.abs(targX - oldX) > 20){
    //         game.add.tween(Player.thisPlayer.gameobject).to({x: targX}, 1000/30);
    //         Player.thisPlayer.gameobject.body.x = targX;
    //     }

    //     if(Math.abs(targY - oldY) > 70){
    //         Player.thisPlayer.gameobject.body.y = targY;
    //     }

    //     if(stationaryX && Math.abs(targX - oldX) > 2){
    //         //game.add.tween(Player.thisPlayer.gameobject).to({x: targX}, 1000/10);
    //         Player.thisPlayer.gameobject.body.x = targX;
    //     }

    //     if(stationaryX && Math.abs(targY - oldY) > 2){
    //         Player.thisPlayer.gameobject.body.y = targY;
    //     }
    // }

        // Player.updateLocalMovement = function(){
    //     Player.thisPlayer.gameobject.y = 0;
    //     Player.thisPlayer.gameobject.x = 0;
    //     if (Inputs.left)
    //     {
    //         Player.thisPlayer.gameobject.x = -150;
    //     }
    //     else if (Inputs.right)
    //     {
    //         Player.thisPlayer.gameobject.x = 150;
    //     }

    //     if (Inputs.up)
    //     {
    //         Player.thisPlayer.gameobject.y = -150;
    //     }
    //     else if (Inputs.down)
    //     {
    //         Player.thisPlayer.gameobject.y = 150;
    //     }
    // }

//client side

    // var Bullet = function(angle, position, id){
    //     var self = {};
    //     self.id = id;
    //     self.maxspeed = 1200;
    //     self.gameobject = game.add.sprite(position[0],position[1], 'bullet');
    //     self.gameobject.anchor.x = 0.5;
    //     self.gameobject.anchor.y = 0.5;
    //     game.physics.p2.enable(self.gameobject);
    //     self.gameobject.body.angle = angle;
    //     self.gameobject.body.velocity.x = Math.cos(angle/180*Math.PI) * self.maxspeed;
    //     self.gameobject.body.velocity.y = Math.sin(angle/180*Math.PI) * self.maxspeed;
    //     self.gameobject.body.collideWorldBounds = false;
    //     self.timeAlive = 0;
    //     Bullet.list[self.id] = self;
    // }

    // Bullet.list = {};

    // Bullet.destroyOldBullets = function(){
    //     for(var id in Bullet.list){
    //         if(Bullet.list[id].timeAlive > 30){
    //             Bullet.destroy(id);
    //         } else{
    //             Bullet.list[id].timeAlive++;
    //         }
    //     }
    // }

    // Bullet.initNewBullet = function(data){
    //     Bullet(data.angle, data.position, data.id);
    //     console.log("New Bullet: " + data.id);
    // }
    // Bullet.destroy = function (id) {
    //     game.physics.p2.removeBody(Bullet.list[id].gameobject.body);
    //     Bullet.list[id].gameobject.kill();
    //     delete Bullet.list[id];
    // }
