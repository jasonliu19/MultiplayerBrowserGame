//Use npm install -g qunit if you cannot run these tests
var Player = require('../server/player.js');

QUnit.test( "Base test", function( assert ) {
  assert.ok( 1 == "1", "Passed!" );
});

QUnit.test( "player.decreaseHealth", function( assert ) {
  var player = Player(23);
  player.decreaseHealth();
  assert.equal( player.healthpoints,100-34, "Passed!" );
});

QUnit.test( "player.destroy", function( assert ) {
  var player = Player(23);
  var id = player.id;
  player.destroy();
  assert.ok(!(id in Player.list), "Passed!" );
});

