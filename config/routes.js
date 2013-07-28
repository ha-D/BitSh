
var main = require("../app/controllers/main")

module.exports = function(app){
	app.get("/", main._index)
}