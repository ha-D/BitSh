
var announce = require('../controllers/announce')

exports.init = function(app){
	app.get('/announce/:userId', announce.announce)
}

module.exports = exports