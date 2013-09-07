var User = require("../models/user")

/**
 * Checks if user is signed in. Returns true if it is, if not returns false
 * and gives req apropiate message 
 */
function checkUser(action, req, res){
	if (req.session.userId === undefined) {
		res.json({
			action: action,
			state: "fail",
			error: {
				message: "User not signed in",
				name: "UserError"
			}
		});
		return false;
	}
	return true;
}

exports.checkUser = checkUser;

exports.userInfo = function(req, res){
	if (!checkUser('user_info', req, res))
		return;

	jRes = {
		action: "user_info"
	}

	user = User.findOne({'_id': req.session.userId}, function(err, result){
		if (err) {
			jRes.state = "fail";
			jRes.error = err;
		}else{
			jRes.state = "success";
			jRes.user = {
				_id: result._id,
				email: result.email,
				name: result.name
			}
		}
		
		res.json(jRes);
	});
}

exports.signup = function(req, res){
	user = new User(req.data.form)
	user.save(function(err){
		if(err){
			res.json({
				action: "signup",
				state: "fail",
				error: err,
				user: { "_id": user.id }
			})
		}else{
		//	req.session.userId = user.id
			res.json({
				action: "signup",
				state: "success",
				user: { "_id": user.id }
			})
		}
	})
}

exports.signin = function(req, res){
	if (req.session.userId !== undefined) {
		res.json({
			action: "user_signin",
			state: "fail",
			error: {
				message: "User already signed in",
				name: "UserError"
			}
		});
		return;
	}

	email = req.data.form.email;
	pass  = req.data.form.password;

	User.findOne({ 'email': email }, function(err, user){
		if (user == null || !user.authenticate(pass)){
			res.json({
				action: "user_signin",
				state: "fail",
				error: {
					message: "Invalid email or password",
					name: "SignInError"
				}
			});
		}else{
			req.session.userId = user._id;
			res.json({
				action: "user_signin",
				state: "success",
				user: {
					_id: user._id
				}
			})
		}
	});
}

exports.signout = function(req, res){
	if (!checkUser('signout', req, res))
		return;

	req.session.userId = undefined;
	res.json({
		action: "signout",
		state: "success"
	});
}

module.exports = exports;