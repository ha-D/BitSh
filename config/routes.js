
var main = require("../app/controllers/main")
  , user = require("../app/controllers/user")

module.exports = function(app){
	app.get("/", main._index)

	app.get("/login", main._login)

	app.post("/signup", user.signup)
}