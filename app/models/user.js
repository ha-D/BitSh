
var mongoose = require('mongoose')
  , Schema   = mongoose.Schema
  , crypto   = require('crypto')


var UserSchema = new Schema({
	name: {type: String, default: ''},
	email: {type: String, default: ''},
	hashed_password: {type: String, default: ''},
	salt: {type: String, default: ''}
})


UserSchema.virtual('password')
	.set(function(password){
		this._password = password
		this.salt = this.makeSalt()
		this.hashed_password = this.encryptPassword(password)
	}).get(function(){
		return this._password
	})

UserSchema.path('name').validate(function(name){
	return name.length
}, "Name cannot be blank")

UserSchema.path('email').validate(function(email){
	return email.length
}, "Email cannot be blank")

UserSchema.path("hashed_password").validate(function(hashed_password){
	return hashed_password.length
}, "Password required")


// UserSchema.path('email').validate(function(email, ))

UserSchema.methods = {
	authenticate: function(pass){
		return this.encryptPassword(pass) === this.hashed_password
	},

	makeSalt: function(){
		return Math.round((new Date().valueOf() * Math.random())) + ''
	},

	encryptPassword: function(password){
		if(!password) return ''
		var encrypted
		try{
			encrypted = crypto.createHmac('sha1', this.salt).update(password).digest('hex')
			return encrypted
		}catch(err){
			return ''
		}
	}
}

mongoose.model('User', UserSchema)

module.exports = exports = mongoose.model('User')