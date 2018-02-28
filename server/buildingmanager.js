var constants = require('./constants.js');
var BLOCKSIZE = constants.BLOCKSIZE;
var Block = require('./block.js');

var BuildingManager = {};

BuildingManager.placeWood = function(x, y){
	var gridx = Math.floor(x/constants.BLOCKSIZE)*constants.BLOCKSIZE;
    var gridy = Math.floor(y/constants.BLOCKSIZE)*constants.BLOCKSIZE;
    Block.create(gridx, gridy, 'wood');
}

module.exports = BuildingManager;