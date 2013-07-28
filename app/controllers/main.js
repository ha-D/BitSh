var path = require('path')
	, config = require('../../config/config')

exports._index = function(req, res){
	res.sendfile(config.public_root + '/index.html')
}