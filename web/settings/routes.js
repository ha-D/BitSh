
var main = require("../controllers/main")
  , user = require("../controllers/user")
  , torrent = require("../controllers/torrent")
  , test  = require("../controllers/test")

exports.init = function(app){
	app.get('/', main._index);
	app.get('/test', main.test);
	app.post('/', main.doAction);
}

exports.actions = {
	'test_info'  : test.info,
	'user_signup':  user.signup,
	'user_signin':  user.signin,
	'user_signout': user.signout,
	'user_info':    user.userInfo,
	'torrent_upload': torrent.upload,
	'torrent_download': torrent.download,
	'torrent_list': torrent.list
}

module.exports = exports