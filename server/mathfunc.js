//distance formula
exports.distance = function(body1,body2){
	return Math.sqrt( Math.pow(body2[0]-body1[0] , 2) + Math.pow(body2[1]-body1[1] , 2));
}
//generate random in range [min,max]
exports.randomInt = function(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
}