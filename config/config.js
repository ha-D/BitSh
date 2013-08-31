var path = require('path')
var root_path = path.normalize(__dirname + '/..')

module.exports = {
	root: root_path,
	public_root: root_path + '/public',
	db: 'mongodb://localhost/mydb'
}