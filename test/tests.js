//Use npm install -g qunit if you cannot run these tests
var Player = require('../server/player.js')
var constants = require('../server/constants.js');

QUnit.test( "Base test", function( assert ) {
  assert.ok( 1 == "1", "Passed!" );
});

QUnit.test( "player.decreaseHealth", function( assert ) {
  var player = Player(23);
  player.decreaseHealth();
  assert.equal( player.hp,100-34, "Passed!" );
});

QUnit.test( "player.destroy", function( assert ) {
  var player = Player(23);
  var id = player.id;
  player.destroy();
  assert.ok(!(id in Player.list), "Passed!" );
});

QUnit.test( "player.shoot = rifle", function( assert ) {
  var player = Player(23);
  player.equippedItem = 1;
  var rifleAmmo = player.ammo.rifle;
  Player.handleShootRequest(player.id);
  assert.equal(player.cooldowns[1], constants.RIFLECOOLDOWN,"Cooldowns okay" );
  assert.equal(player.ammo.rifle, rifleAmmo-1,"Passed!" );
});

QUnit.test( "player.shoot = shotgun", function( assert ) {
  var player = Player(23);
  player.equippedItem = 2;
  var shotgunAmmo = player.ammo.shotgun;
  Player.handleShootRequest(player.id);
  assert.equal(player.cooldowns[2], constants.SHOTGUNCOOLDOWN,"Cooldowns okay" );
  assert.equal(player.ammo.shotgun, shotgunAmmo-1,"Passed!" );
});

QUnit.test( "player.shoot = sniper", function( assert ) {
  var player = Player(23);
  player.equippedItem = 3;
  var sniperAmmo = player.ammo.sniper;
  Player.handleShootRequest(player.id);
  assert.equal(player.cooldowns[3], constants.SNIPERCOOLDOWN,"Cooldowns okay" );
  assert.equal(player.ammo.sniper, sniperAmmo-1,"Ammo ok" );
});
