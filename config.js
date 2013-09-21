var path = require('path')

var root_path = path.normalize(__dirname) + '/';

//var siteUrl = 'http://localhost';
var siteUrl = 'http://213.233.171.252';
var logPath = './logs/';

config = {
	root: root_path,
	publicRoot: root_path + 'public/',
	db: 'mongodb://localhost/mydb',
	web: {
		port: 8080,
		url: siteUrl,
		logPath: logPath + 'web/'
	},
	tracker: {
		port: 9000,
		url: siteUrl,
		logPath: logPath + 'tracker/'
	}
}

config.web.url += ':' + config.web.port.toString() + '/';
config.tracker.url += ':' + config.tracker.port.toString()  + '/';

module.exports = config;