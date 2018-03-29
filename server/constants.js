//Enemy Attack Constants
exports.ENEMYDAMAGE = 25;
exports.ENEMYBLOCKDAMAGE = 100;
exports.HITRADIUS = 70;
exports.HITDELAY = 2;

//Equipped items
exports.RIFLEDAMAGE = 50;
exports.SHOTGUNDAMAGE = 34;
exports.SNIPERDAMAGE = 100;
exports.TOOLDAMAGETOBLOCK = 250;
exports.RIFLECOOLDOWN = 8;
exports.SHOTGUNCOOLDOWN = 20;
exports.SNIPERCOOLDOWN = 40;
exports.TOOLCOOLDOWN = 5;
exports.RESPAWNTIME = 600;


//Collision groups
exports.PLAYER = Math.pow(2,0);
exports.ENEMY = Math.pow(2,1);
exports.BULLET = Math.pow(2,2);
exports.BLOCK = Math.pow(2,3);
exports.GROUNDITEM = Math.pow(2,4);

//World
exports.WORLDHEIGHT = 970;
exports.WORLDWIDTH = 1840;
exports.BLOCKSIZE = 64;
exports.HUMANOIDSIZE = 50;
exports.GROUNDITEMSIZE = 16;
exports.DEFAULTBLOCKTEXTURE = 'grass';
exports.MAXGROUNDITEMS = 15;

