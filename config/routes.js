
var main = require("../app/controllers/main")
  , user = require("../app/controllers/user")
  , tracker = require("../app/controllers/tracker")

exports.init = function(app){
	app.get('/', main._index);
	app.post('/', main.doAction);
	app.get('/tracker/announce/:userId', tracker.announce);
	app.get('/tracker/announce', tracker.announce)
}

exports.actions = {
	'user_signup':  user.signup,
	'user_signin':  user.signin,
	'user_signout': user.signout,
	'user_info':    user.userInfo
}

module.exports = exports