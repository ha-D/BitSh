var winston = require('winston')

var config  = require('../../config')

var logger = new (winston.Logger)({
	transports: [
		new (winston.transports.Console)({
			level: 'debug',
			colorize: true,
			timestamp: false
		}),
		new (winston.transports.File)({
			filename: config.web.logPath + 'web.log',
			level: 'info',
			handleExceptions: false,
			timestamp: true
		})
	],
	exitOnError: true
});

module.exports = exports = logger;