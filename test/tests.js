//Use npm install -g qunit if you cannot run these tests
var app = require('../app.js');

QUnit.test( "Base test", function( assert ) {
  assert.ok( 1 == "1", "Passed!" );
});

QUnit.test( "Player decrease health", function( assert ) {
  var player = app.Player(23);
  player.decreaseHealth();
  assert.equal( player.healthpoints,100-34, "Passed!" );
});