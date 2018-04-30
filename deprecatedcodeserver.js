//Server side
// var Bullet = function(angle, position){
// 	var self = {};
// 	self.id = Math.random();
// 	self.maxspeed = 1200;
// 	self.used = false;
// 	self.hasCollided = false;
// 	self.body = new p2.Body({
// 		mass : 1,
// 		position : position,
// 		angle: angle,
// 		velocity: [Math.cos(angle/180*Math.PI) * self.maxspeed, Math.sin(angle/180*Math.PI) * self.maxspeed],
// 		id: self.id,
// 	});
// 	var bulletshape = new p2.Box({width:2, height:16});
// 	bulletshape.collisionGroup = BULLET;
// 	bulletshape.collisionMask = BULLET | ENEMY | BLOCK;
// 	self.body.addShape(bulletshape);
// 	world.addBody(self.body);
// 	self.timeAlive = 0;
// 	Bullet.list[self.id] = self;
// 	return self;
// }

// Bullet.list = {};

// Bullet.destroyOldBullets = function(){
// 	for(var id in Bullet.list){
// 		if(Bullet.list[id].timeAlive > 60){
// 			Bullet.destroy(id);
// 		} else{
// 			Bullet.list[id].timeAlive++;
// 		}
// 	}
// }


// Bullet.destroy = function(id){
// 	if(typeof Bullet.list[id] === 'undefined')
// 		return;
// 	world.removeBody(Bullet.list[id].body);
// 	delete Bullet.list[id];
//     for(i in SOCKET_LIST){
//         SOCKET_LIST[i].emit('deleteBullet', id);
//     }
// }