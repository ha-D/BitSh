
var main = require("../app/controllers/main")
  , user = require("../app/controllers/user")

exports.init = function(app){
	app.get('/', main._index);
	app.post('/', main.doAction);
}

exports.actions = {
	'user_signup':  user.signup,
	'user_signin':  user.signin,
	'user_signout': user.signout,
	'user_info':    user._info
}

module.exports = exports