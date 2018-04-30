var constants = require('./constants.js');
var BLOCKSIZE = constants.BLOCKSIZE;
var Block = require('./block.js');

var BuildingManager = {};

BuildingManager.placeWood = function(x, y){
	var gridx = Math.floor(x/constants.BLOCKSIZE)*constants.BLOCKSIZE -32;
    var gridy = Math.floor(y/constants.BLOCKSIZE)*constants.BLOCKSIZE -32;
    Block.create(gridx, gridy, 'wood');
}

module.exports = BuildingManager;