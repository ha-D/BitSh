var User = require("../models/user")

exports.signup = function(req, res){
	user = new User(req.body)
	user.save(function(err){
		if(err){
			res.json({
				action: "signup",
				state: "fail",
				error: err,
				user: user
			})
		}else{
			req.session.user_id = user.id
			res.json({
				action: "signup",
				state: "success",
				user: "user"
			})
		}
	})
}