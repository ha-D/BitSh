
var main = require("../app/controllers/main")
  , user = require("../app/controllers/user")
  , tracker = require("../app/controllers/tracker")
  , torrent = require("../app/controllers/torrent")
  , test  = require("../app/controllers/test")

exports.init = function(app){
	app.get('/', main._index);
	app.post('/', main.doAction);
	app.get('/tracker/announce/:userId', tracker.announce);
	app.get('/tracker/announce', tracker.announce)
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